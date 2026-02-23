import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notify_new_order: boolean;
  notify_status_change: boolean;
  notify_chat_message: boolean;
  notify_payment_reminder: boolean;
  sound_enabled: boolean;
  push_enabled: boolean;
}

const DEFAULT_PREFS: Omit<NotificationPreferences, 'id' | 'user_id'> = {
  notify_new_order: true,
  notify_status_change: true,
  notify_chat_message: true,
  notify_payment_reminder: true,
  sound_enabled: true,
  push_enabled: false,
};

export const useNotificationPreferences = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const queryKey = ['notification-preferences', user?.id];

  const { data: preferences, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!user) return { id: '', user_id: '', ...DEFAULT_PREFS };

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default preferences
        const { data: created, error: createError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        return created as unknown as NotificationPreferences;
      }

      return data as unknown as NotificationPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id'>>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    preferences: preferences || { id: '', user_id: '', ...DEFAULT_PREFS },
    isLoading,
    updatePreferences,
  };
};
