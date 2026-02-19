import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Trial Config ──────────────────────────────────────────────

export interface PremiumTrialConfig {
  enabled: boolean;
  durationDays: number;
}

const DEFAULT_TRIAL_CONFIG: PremiumTrialConfig = {
  enabled: true,
  durationDays: 30,
};

export const usePremiumTrialConfig = () => {
  return useQuery({
    queryKey: ['premium-trial-config'],
    queryFn: async (): Promise<PremiumTrialConfig> => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'premium_trial_config')
        .maybeSingle();

      if (data?.value) {
        const val = data.value as unknown as PremiumTrialConfig;
        return {
          enabled: val.enabled ?? DEFAULT_TRIAL_CONFIG.enabled,
          durationDays: val.durationDays ?? DEFAULT_TRIAL_CONFIG.durationDays,
        };
      }
      return DEFAULT_TRIAL_CONFIG;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePremiumTrialConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: PremiumTrialConfig) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'premium_trial_config')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: config as any, updated_at: new Date().toISOString() })
          .eq('key', 'premium_trial_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert({ key: 'premium_trial_config', value: config as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-trial-config'] });
      queryClient.invalidateQueries({ queryKey: ['free-trial'] });
    },
  });
};

// ── Plan Config ───────────────────────────────────────────────

export interface PremiumPlanConfig {
  name: string;
  description: string;
  priceYearly: number;
  features: string[];
}

const DEFAULT_PLAN_CONFIG: PremiumPlanConfig = {
  name: 'Premium Ibadah Tracker',
  description: 'Akses penuh fitur cloud & statistik',
  priceYearly: 29000,
  features: [
    'Sync data ke cloud',
    'Backup otomatis',
    'Akses multi-device',
    'Statistik lengkap',
    'Export data',
  ],
};

export const usePremiumPlanConfig = () => {
  return useQuery({
    queryKey: ['premium-plan-config'],
    queryFn: async (): Promise<PremiumPlanConfig> => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'premium_plan_config')
        .maybeSingle();

      if (data?.value) {
        const val = data.value as unknown as PremiumPlanConfig;
        return {
          name: val.name || DEFAULT_PLAN_CONFIG.name,
          description: val.description || DEFAULT_PLAN_CONFIG.description,
          priceYearly: val.priceYearly ?? DEFAULT_PLAN_CONFIG.priceYearly,
          features: val.features?.length ? val.features : DEFAULT_PLAN_CONFIG.features,
        };
      }
      return DEFAULT_PLAN_CONFIG;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePremiumPlanConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: PremiumPlanConfig) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'premium_plan_config')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: config as any, updated_at: new Date().toISOString() })
          .eq('key', 'premium_plan_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert({ key: 'premium_plan_config', value: config as any });
        if (error) throw error;
      }

      // Also sync subscription_plans table and platform_settings price
      await supabase
        .from('subscription_plans')
        .update({
          name: config.name,
          description: config.description,
          price_yearly: config.priceYearly,
          features: config.features,
        })
        .eq('is_active', true);

      const { data: priceSetting } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'subscription_price_yearly')
        .maybeSingle();

      if (priceSetting) {
        await supabase
          .from('platform_settings')
          .update({ value: config.priceYearly.toString() })
          .eq('key', 'subscription_price_yearly');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-plan-config'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-price-setting'] });
    },
  });
};
