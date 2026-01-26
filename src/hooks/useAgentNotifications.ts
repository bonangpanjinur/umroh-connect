import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface AgentNotification {
  id: string;
  travel_id: string;
  notification_type: 'new_inquiry' | 'overdue_payment' | 'new_booking' | 'new_haji_registration';
  title: string;
  body: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useAgentNotifications = (travelId?: string) => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const query = useQuery({
    queryKey: ['agent-notifications', travelId],
    queryFn: async () => {
      if (!travelId) return [];

      const { data, error } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AgentNotification[];
    },
    enabled: !!travelId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!travelId) return;

    const channel = supabase
      .channel(`agent-notifications-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_notifications',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          console.log('New agent notification:', payload);
          queryClient.invalidateQueries({ queryKey: ['agent-notifications', travelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [travelId, queryClient]);

  // Unread count
  const unreadCount = query.data?.filter(n => !n.is_read).length || 0;

  return { ...query, unreadCount };
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (travelId: string) => {
      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('travel_id', travelId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-notifications'] });
    },
  });
};

// Trigger notification check manually
export const useTriggerNotificationCheck = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-agent-notifications');
      if (error) throw error;
      return data;
    },
  });
};