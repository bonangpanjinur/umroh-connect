import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook that subscribes to real-time order status changes.
 * Updates the relevant query cache automatically.
 */
export const useRealtimeOrders = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-orders-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shop_orders',
        },
        (payload) => {
          const updated = payload.new as any;
          // Invalidate buyer orders
          if (updated.user_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['shop-orders', user.id] });
          }
          // Invalidate seller orders (seller will pick it up via their query)
          queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_orders',
        },
        () => {
          // New orders -> refresh seller list
          queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
