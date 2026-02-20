import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface ChatNotification {
  id: string;
  user_id: string;
  chat_message_id: string;
  seller_id: string;
  sender_name: string | null;
  message_preview: string | null;
  is_read: boolean;
  created_at: string;
}

export const useChatNotifications = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['chat-notifications', user?.id],
    queryFn: async (): Promise<ChatNotification[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('chat_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as ChatNotification[];
    },
    enabled: !!user,
  });

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-notifications', user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAsRead = async (notificationId?: string) => {
    if (!user) return;
    let query = supabase
      .from('chat_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    if (notificationId) {
      query = query.eq('id', notificationId);
    }
    await query;
    queryClient.invalidateQueries({ queryKey: ['chat-notifications', user.id] });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('chat_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    queryClient.invalidateQueries({ queryKey: ['chat-notifications', user.id] });
  };

  const unreadCount = notifications.length;

  return { notifications, isLoading, unreadCount, markAsRead, markAllAsRead };
};
