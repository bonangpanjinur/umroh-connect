import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderStatusEntry {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export const useOrderStatusHistory = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['order-status-history', orderId],
    queryFn: async (): Promise<OrderStatusEntry[]> => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as OrderStatusEntry[];
    },
    enabled: !!orderId,
  });
};
