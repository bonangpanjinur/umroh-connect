import { useQuery } from '@tanstack/react-query';
import { supabaseUntyped as supabase } from '@/lib/supabase';

export interface DepartureAuditEntry {
  id: string;
  departure_id: string;
  package_id: string;
  travel_id: string;
  change_type: 'created' | 'status' | 'seats' | 'price' | 'mixed';
  old_status: string | null;
  new_status: string | null;
  old_total_seats: number | null;
  new_total_seats: number | null;
  old_available_seats: number | null;
  new_available_seats: number | null;
  old_price: number | null;
  new_price: number | null;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export const usePackageAuditLog = (packageId: string | undefined, limit = 100) => {
  return useQuery({
    queryKey: ['departure-audit', packageId, limit],
    queryFn: async (): Promise<DepartureAuditEntry[]> => {
      if (!packageId) return [];
      const { data, error } = await supabase
        .from('departure_audit_log')
        .select('*')
        .eq('package_id', packageId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as DepartureAuditEntry[];
    },
    enabled: !!packageId,
  });
};
