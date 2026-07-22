-- Canchazo — cierre de huecos: auditoría server-side de pagos Wompi
-- Ejecutar en el SQL Editor de Supabase después de 002-006.
--
-- Complementa la Edge Function en supabase/functions/wompi-webhook/. Registra
-- lo que Wompi realmente reporta desde su servidor, con firma verificada —
-- independiente de lo que el navegador dice que pasó. Es una capa de
-- auditoría, no reconciliación automática todavía: hoy nada actualiza el
-- estado de una orden si un webhook reporta una discrepancia. Ver AUDIT.md
-- para el razonamiento completo.

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'wompi',
  event_type text,
  transaction_id text,
  reference text,
  status text,
  amount_in_cents bigint,
  verified boolean not null default false,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

alter table payment_events enable row level security;

-- La Edge Function escribe con la service_role key (se salta RLS por diseño).
-- Desde el cliente, solo admin puede leerlos.
drop policy if exists "Admin ve eventos de pago" on payment_events;
create policy "Admin ve eventos de pago" on payment_events for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
