import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Mengambil variabel lingkungan
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- DEBUGGING AREA ---
// Buka Console Browser (F12) untuk melihat output ini saat halaman dimuat
console.group('🔌 Supabase Connection Check');
console.log('Status: Initializing Client...');
console.log('URL Terbaca:', SUPABASE_URL ? `✅ Ada (${SUPABASE_URL.substring(0, 15)}...)` : '❌ KOSONG/UNDEFINED');
console.log('Key Terbaca:', SUPABASE_PUBLISHABLE_KEY ? '✅ Ada (Hidden)' : '❌ KOSONG/UNDEFINED');

// Cek sederhana apakah URL masih mengarah ke Lovable (biasanya ada kata 'lovable' atau project ID lama)
if (SUPABASE_URL && SUPABASE_URL.includes('lovable')) {
    console.warn('⚠️ PERINGATAN: URL Supabase sepertinya masih mengarah ke domain Lovable lama, bukan Supabase project Anda sendiri.');
}
console.groupEnd();
// ----------------------

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '🚨 CRITICAL: Supabase Environment Variables belum terbaca. Pastikan file .env ada di root folder dan server sudah di-restart.'
  );
}

// Fallback value kosong agar aplikasi tidak crash saat startup jika env belum ada,
// tapi akan error saat mencoba fetch data.
export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_PUBLISHABLE_KEY || '',
  {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
