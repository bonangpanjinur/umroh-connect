import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Mengambil variabel lingkungan dari .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Pastikan environment variables ada
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '🚨 CRITICAL: Supabase Environment Variables tidak ditemukan.',
    '\nURL:', SUPABASE_URL ? '✅' : '❌',
    '\nKey:', SUPABASE_PUBLISHABLE_KEY ? '✅' : '❌'
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_PUBLISHABLE_KEY || '',
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
