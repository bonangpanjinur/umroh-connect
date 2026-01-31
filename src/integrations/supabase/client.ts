import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "Supabase URL atau Anon Key hilang. Pastikan Anda telah mengatur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env Anda."
  );
}

// Pastikan kita tidak menggunakan nilai fallback string kosong yang bisa menyebabkan error URL tidak valid
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-key'
);