// Kita ambil dari file kustom kita sendiri
import { myCustomSupabase } from '../supabaseConfig';

// Export sebagai 'supabase' agar aplikasi tetap jalan normal
export const supabase = myCustomSupabase;

// Export alias untuk kompatibilitas kode lama
export const supabaseUntyped = myCustomSupabase;
