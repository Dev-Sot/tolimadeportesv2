import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Tolima Deportes] Faltan variables de entorno:\n' +
    'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar en .env.local'
  );
}

// createClient never throws — if keys are wrong, queries will fail gracefully
export const supabase = createClient(
  supabaseUrl   || 'https://dqsshdzgbhiiaykaicdq.supabase.co',
  supabaseAnonKey || 'sb_publishable_602zteSqODDubUD1gZiYyg_bJLIwI68'
);
