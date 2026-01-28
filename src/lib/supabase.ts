// Mencegah duplikasi koneksi.
// File ini sekarang hanya me-redirect ke konfigurasi utama di src/integrations/supabase/client.ts
// Ini memastikan seluruh aplikasi menggunakan satu kredensial yang sama dari .env

import { supabase } from '../integrations/supabase/client';

export { supabase };

// Tambahkan export ini untuk menjaga kompatibilitas dengan file lama (seperti useAuth.ts)
// yang masih mencari 'supabaseUntyped'. Kita arahkan ke client yang sama.
export const supabaseUntyped = supabase;
