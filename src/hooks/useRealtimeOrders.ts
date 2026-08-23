import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/coreApi';

const statusLabels: Record<string, string> = {
  pending: 'Menunggu Bayar',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

/**
 * Polls the Core Commerce API for order changes. Core remains the source of
 * truth; the frontend never subscribes directly to database tables.
 */
export const useRealtimeOrders = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const previousRef = useRef<Map<string, string>>(new Map());
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const refresh = async () => {
      try {
        const orders = await coreApi.listCommerceOrders();
        if (!active) return;
        const next = new Map(orders.map((order) => [String(order.id), String(order.status || '')]));
        for (const order of orders) {
          const id = String(order.id);
          const status = String(order.status || '');
          const previous = previousRef.current.get(id);
          if (previous && previous !== status && order.user_id === user.id) {
            toast({
              title: `Pesanan ${String(order.order_code || '')}`,
              description: `Status berubah: ${statusLabels[status] || status}`,
            });
            playNotifSound();
          }
        }
        previousRef.current = next;
        queryClient.invalidateQueries({ queryKey: ['shop-orders', user.id] });
        queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      } catch {
        // The owning query exposes the visible error state; background polling
        // must not interrupt the user's current screen.
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      previousRef.current.clear();
    };
  }, [user, queryClient]);

  function playNotifSound() {
    try {
      if (!soundRef.current) {
        soundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
        soundRef.current.volume = 0.3;
      }
      void soundRef.current.play().catch(() => undefined);
    } catch {
      // Browser autoplay policy may block notification sounds.
    }
  }
};
