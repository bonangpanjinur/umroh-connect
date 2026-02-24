import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  pending: 'Menunggu Bayar',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

/**
 * Hook that subscribes to real-time order status changes.
 * Shows toast notifications and updates the relevant query cache automatically.
 */
export const useRealtimeOrders = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const soundRef = useRef<HTMLAudioElement | null>(null);

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
          const old = payload.old as any;

          // Invalidate buyer orders
          if (updated.user_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['shop-orders', user.id] });

            // Show toast to buyer when status changes
            if (old.status !== updated.status) {
              const label = statusLabels[updated.status] || updated.status;
              toast({
                title: `📦 Pesanan ${updated.order_code || ''}`,
                description: `Status berubah: ${label}`,
              });
              playNotifSound();
            }
          }

          // Invalidate seller orders
          queryClient.invalidateQueries({ queryKey: ['seller-orders'] });

          // Invalidate order status history
          queryClient.invalidateQueries({ queryKey: ['order-status-history', updated.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_orders',
        },
        (payload) => {
          const newOrder = payload.new as any;
          // New orders -> refresh seller list
          queryClient.invalidateQueries({ queryKey: ['seller-orders'] });

          // Show toast to seller
          if (newOrder.user_id !== user.id) {
            toast({
              title: '🔔 Pesanan Baru!',
              description: `Kode: ${newOrder.order_code || 'Baru'}`,
            });
            playNotifSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_history',
        },
        (payload) => {
          const entry = payload.new as any;
          queryClient.invalidateQueries({ queryKey: ['order-status-history', entry.order_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  function playNotifSound() {
    try {
      if (!soundRef.current) {
        soundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
        soundRef.current.volume = 0.3;
      }
      soundRef.current.play().catch(() => {});
    } catch {}
  }
};
