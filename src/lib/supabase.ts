// Re-export dari client resmi Lovable Cloud
import { supabase } from '@/integrations/supabase/client';

// Export untuk kompatibilitas
export { supabase };
export const supabaseUntyped = supabase;
