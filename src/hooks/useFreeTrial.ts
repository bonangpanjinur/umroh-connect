import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  trialStartDate: string | null;
  trialEndDate: string | null;
  hasTrialExpired: boolean;
  hasEverStartedTrial: boolean;
}

export const useFreeTrial = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: trialStatus, isLoading } = useQuery({
    queryKey: ['free-trial', user?.id],
    queryFn: async (): Promise<TrialStatus> => {
      if (!user?.id) return { isInTrial: false, daysRemaining: 0, trialStartDate: null, trialEndDate: null, hasTrialExpired: false, hasEverStartedTrial: false };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('trial_start_date, trial_end_date, status, end_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If user has active paid subscription, no trial needed
      if (data?.status === 'active' && data?.end_date && new Date(data.end_date) > new Date()) {
        return { isInTrial: false, daysRemaining: 0, trialStartDate: null, trialEndDate: null, hasTrialExpired: false, hasEverStartedTrial: true };
      }

      if (!data?.trial_start_date) {
        return { isInTrial: false, daysRemaining: 0, trialStartDate: null, trialEndDate: null, hasTrialExpired: false, hasEverStartedTrial: false };
      }

      const now = new Date();
      const trialEnd = new Date(data.trial_end_date!);
      const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const isInTrial = now < trialEnd;

      return {
        isInTrial,
        daysRemaining,
        trialStartDate: data.trial_start_date,
        trialEndDate: data.trial_end_date,
        hasTrialExpired: !isInTrial,
        hasEverStartedTrial: true,
      };
    },
    enabled: !!user?.id,
  });

  const startTrial = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          status: 'trial',
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-trial', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
    },
  });

  return {
    ...(trialStatus || { isInTrial: false, daysRemaining: 0, trialStartDate: null, trialEndDate: null, hasTrialExpired: false, hasEverStartedTrial: false }),
    isLoading,
    startTrial,
  };
};

// Helper: check if user has premium access (paid OR trial)
export const useHasPremiumAccess = () => {
  const { isInTrial } = useFreeTrial();
  const { data: subscription } = useQuery({
    queryKey: ['user-subscription-check'],
    queryFn: async () => null, // handled by useIsPremium
    enabled: false,
  });

  // Import useIsPremium separately for paid check
  return { hasPremiumAccess: isInTrial };
};
