import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** false si falta configurar .env.local — App.tsx muestra una pantalla de
 *  ayuda en vez de dejar que cada llamada a Supabase falle en silencio. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Sin fallback a una instancia real: si faltan las variables de entorno, se
// usa un cliente con credenciales placeholder que nunca se ejecuta de verdad
// (App.tsx bloquea el render con la pantalla de configuración antes de que
// cualquier componente llegue a usarlo). Lanzar un error aquí arriba —a nivel
// de módulo— rompía el arranque de React antes de que el ErrorBoundary
// pudiera atraparlo, dejando la página completamente en blanco.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'canchazo-supabase-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);