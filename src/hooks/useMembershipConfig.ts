import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MEMBERSHIP_PLANS, type MembershipPlan } from '@/hooks/useAgentMembership';

interface MembershipConfigData {
  plans: MembershipPlan[];
}

/**
 * Hook to read full membership config from platform_settings.
 * Priority: membership_config > membership_prices > hardcoded MEMBERSHIP_PLANS
 */
export const useMembershipConfig = () => {
  return useQuery({
    queryKey: ['membership-config'],
    queryFn: async (): Promise<MembershipPlan[]> => {
      // 1. Try membership_config (full config)
      const { data: configData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'membership_config')
        .maybeSingle();

      if (configData?.value) {
        const config = configData.value as unknown as MembershipConfigData;
        if (config.plans && Array.isArray(config.plans) && config.plans.length > 0) {
          return config.plans;
        }
      }

      // 2. Fallback: membership_prices (price-only)
      const { data: priceData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'membership_prices')
        .maybeSingle();

      if (priceData?.value) {
        const prices = priceData.value as { free: number; pro: number; premium: number };
        return MEMBERSHIP_PLANS.map(plan => ({
          ...plan,
          price: prices[plan.id as keyof typeof prices] ?? plan.price,
        }));
      }

      // 3. Final fallback: hardcoded
      return MEMBERSHIP_PLANS;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Mutation to save full membership config to platform_settings
 */
export const useSaveMembershipConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plans: MembershipPlan[]) => {
      const configValue = { plans };

      // Upsert membership_config
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'membership_config')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: configValue as any, updated_at: new Date().toISOString() })
          .eq('key', 'membership_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert({ key: 'membership_config', value: configValue as any });
        if (error) throw error;
      }

      // Also sync membership_prices for backward compat
      const prices: Record<string, number> = {};
      plans.forEach(p => { prices[p.id] = p.price; });

      const { data: existingPrices } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'membership_prices')
        .maybeSingle();

      if (existingPrices) {
        await supabase
          .from('platform_settings')
          .update({ value: prices as any, updated_at: new Date().toISOString() })
          .eq('key', 'membership_prices');
      } else {
        await supabase
          .from('platform_settings')
          .insert({ key: 'membership_prices', value: prices as any });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-config'] });
      queryClient.invalidateQueries({ queryKey: ['platform-config-membership-prices'] });
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });
};

/**
 * Helper to get a plan by ID from a plans array
 */
export const getPlanFromConfig = (plans: MembershipPlan[], planId: string): MembershipPlan => {
  return plans.find(p => p.id === planId) || plans[0] || MEMBERSHIP_PLANS[0];
};
