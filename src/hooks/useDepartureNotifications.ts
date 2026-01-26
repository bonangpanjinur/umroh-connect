import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface DepartureNotification {
  id: string;
  user_id: string;
  booking_id: string | null;
  notification_type: 'h30' | 'h14' | 'h7' | 'h3' | 'h1' | 'h0';
  title: string;
  body: string;
  sent_at: string;
  is_read: boolean;
  read_at: string | null;
}

const notificationTypeLabels: Record<string, string> = {
  h30: 'H-30',
  h14: 'H-14',
  h7: 'H-7',
  h3: 'H-3',
  h1: 'H-1',
  h0: 'Hari H',
};

const notificationTypeColors: Record<string, string> = {
  h30: 'bg-slate-100 text-slate-700',
  h14: 'bg-blue-100 text-blue-700',
  h7: 'bg-primary/10 text-primary',
  h3: 'bg-orange-100 text-orange-700',
  h1: 'bg-amber-100 text-amber-700',
  h0: 'bg-emerald-100 text-emerald-700',
};

export const useDepartureNotifications = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['departure-notifications', user?.id],
    queryFn: async (): Promise<DepartureNotification[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('departure_notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as DepartureNotification[];
    },
    enabled: !!user?.id,
  });
};

export const useUnreadDepartureCount = () => {
  const { data: notifications } = useDepartureNotifications();
  return (notifications || []).filter(n => !n.is_read).length;
};

export const useMarkDepartureNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any)
        .from('departure_notification_logs')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departure-notifications'] });
    },
  });
};

export const useMarkAllDepartureNotificationsRead = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await (supabase as any)
        .from('departure_notification_logs')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departure-notifications'] });
    },
  });
};

export { notificationTypeLabels, notificationTypeColors };
