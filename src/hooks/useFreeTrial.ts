import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePremiumTrialConfig } from '@/hooks/usePremiumConfig';
import { useIsPremium } from '@/hooks/usePremiumSubscription';

interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  trialStartDate: string | null;
  trialEndDate: string | null;
  hasTrialExpired: boolean;
  hasEverStartedTrial: boolean;
  trialDurationDays: number;
  trialEnabled: boolean;
}

const EMPTY: TrialStatus = {
  isInTrial: false,
  daysRemaining: 0,
  trialStartDate: null,
  trialEndDate: null,
  hasTrialExpired: false,
  hasEverStartedTrial: false,
  trialDurationDays: 30,
  trialEnabled: true,
};

export const useFreeTrial = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: trialConfig } = usePremiumTrialConfig();

  const durationDays = trialConfig?.durationDays ?? 30;
  const trialEnabled = trialConfig?.enabled ?? true;

  const { data: trialStatus, isLoading } = useQuery({
    queryKey: ['free-trial', user?.id, durationDays, trialEnabled],
    queryFn: async (): Promise<TrialStatus> => {
      if (!user?.id) return { ...EMPTY, trialDurationDays: durationDays, trialEnabled };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('trial_start_date, trial_end_date, status, end_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const base = { trialDurationDays: durationDays, trialEnabled };

      // Active paid subscription
      if (data?.status === 'active' && data?.end_date && new Date(data.end_date) > new Date()) {
        return { ...EMPTY, ...base, hasEverStartedTrial: true };
      }

      if (!data?.trial_start_date) {
        return { ...EMPTY, ...base };
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
        ...base,
      };
    },
    enabled: !!user?.id,
  });

  const startTrial = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!trialEnabled) throw new Error('Trial is disabled');

      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + durationDays);

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
    ...(trialStatus || { ...EMPTY, trialDurationDays: durationDays, trialEnabled }),
    isLoading,
    startTrial,
  };
};

export const useHasPremiumAccess = () => {
  const { isInTrial } = useFreeTrial();
  const { isPremium } = useIsPremium();
  const { isAdmin } = useAuthContext();

  // Admin selalu punya akses premium
  const hasPremiumAccess = isAdmin() || isPremium || isInTrial;
  return { hasPremiumAccess };
};
