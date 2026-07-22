// Canchazo — webhook de eventos de Wompi (Deno / Supabase Edge Functions)
//
// Recibe los eventos que Wompi envía desde su servidor (ej. "transaction.updated"),
// verifica la firma con el secreto de eventos, y los registra en `payment_events`
// como una auditoría server-side independiente de lo que el navegador reporta.
//
// ⚠️ IMPORTANTE antes de desplegar: el esquema de firma implementado abajo
// (concatenar los valores de `signature.properties` + `timestamp` + el
// secreto, y comparar el SHA-256 contra `signature.checksum`) es el formato
// documentado por Wompi al momento de escribir esto, pero no se pudo probar
// contra su sandbox real desde este entorno — no hay acceso a una cuenta de
// Wompi ni a la capacidad de desplegar Edge Functions aquí. Verifica el
// formato vigente en https://docs.wompi.co/docs/colombia/eventos/ antes de
// confiar en esto en producción, e idealmente prueba con un evento real de
// su sandbox antes de activarlo con dinero real.
//
// Desplegar:
//   supabase functions deploy wompi-webhook --no-verify-jwt
//   supabase secrets set WOMPI_EVENTS_SECRET=<secreto de eventos, NO la llave pública>
//
// Luego registra la URL resultante (https://<project>.supabase.co/functions/v1/wompi-webhook)
// en el dashboard de Wompi → Configuración → Eventos.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EVENTS_SECRET = Deno.env.get('WOMPI_EVENTS_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// deno-lint-ignore no-explicit-any
function getByPath(obj: any, path: string): unknown {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

// deno-lint-ignore no-explicit-any
async function verifySignature(body: any): Promise<boolean> {
  const sig = body?.signature;
  if (!EVENTS_SECRET || !sig?.checksum || !Array.isArray(sig.properties) || body?.timestamp == null) {
    return false;
  }
  const concatenated = sig.properties.map((p: string) => String(getByPath(body, p) ?? '')).join('');
  const toHash = concatenated + String(body.timestamp) + EVENTS_SECRET;
  const checksum = await sha256Hex(toHash);
  return checksum.toUpperCase() === String(sig.checksum).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const verified = await verifySignature(body);
  const tx = body?.data?.transaction ?? {};

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await supabase.from('payment_events').insert({
    provider: 'wompi',
    event_type: body?.event ?? 'unknown',
    transaction_id: tx.id ?? null,
    reference: tx.reference ?? null,
    status: tx.status ?? null,
    amount_in_cents: tx.amount_in_cents ?? null,
    verified,
    raw_payload: body,
  });

  if (error) {
    // No devolvemos error a Wompi por esto — un fallo nuestro al guardar el
    // registro no debe hacer que reintente el mismo webhook indefinidamente.
    console.error('payment_events insert failed:', error.message);
  }

  return new Response(JSON.stringify({ received: true, verified }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
