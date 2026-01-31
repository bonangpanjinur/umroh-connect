// Menggunakan single instance dari integrations untuk menghindari duplikasi session
// dan memastikan token Auth terbaca dengan benar di seluruh fitur (termasuk Tracker & Payment)
import { supabase } from "@/integrations/supabase/client";

export { supabase };