import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://dqsshdzgbhiiaykaicdq.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_602zteSqODDubUD1gZiYyg_bJLIwI68',
  {
    auth: {
      persistSession: true,
      storageKey: 'tolima-supabase-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);