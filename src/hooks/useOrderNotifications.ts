import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface OrderNotification {
  id: string;
  user_id: string;
  order_id: string | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useOrderNotifications = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const queryKey = ['order-notifications', user?.id];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<OrderNotification[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as OrderNotification[];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`order-notif-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { notifications, unreadCount, isLoading, markAllRead };
};
