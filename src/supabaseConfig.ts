import { createClient } from '@supabase/supabase-js';

// Kita paksa pakai environment variable di sini
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase Env Vars missing!");
}

export const myCustomSupabase = createClient(
  supabaseUrl || '', 
  supabaseKey || '',
  {
      auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
  }
);
