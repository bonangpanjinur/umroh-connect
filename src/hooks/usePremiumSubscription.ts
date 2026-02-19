import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_yearly: number;
  features: string[];
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  payment_proof_url: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  start_date: string | null;
  end_date: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch active subscription plans
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_yearly', { ascending: true });

      if (error) throw error;
      return (data || []) as SubscriptionPlan[];
    },
  });
};

// Fetch user's subscription status
export const useUserSubscription = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user?.id,
  });
};

// Check if user has active premium
export const useIsPremium = () => {
  const { data: subscription, isLoading } = useUserSubscription();
  
  const isPremium = subscription?.status === 'active' && 
    subscription?.end_date && 
    new Date(subscription.end_date) > new Date();

  return { isPremium, isLoading, subscription };
};

// Create subscription request (upload payment proof)
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (params: {
      planId: string;
      paymentProofUrl: string;
      paymentAmount: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: params.planId,
          status: 'pending',
          payment_proof_url: params.paymentProofUrl,
          payment_amount: params.paymentAmount,
          payment_date: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast({
        title: 'Pembayaran Terkirim! 🎉',
        description: 'Mohon tunggu verifikasi dari admin (1-24 jam)',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal mengirim pembayaran',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Admin: Get all subscriptions with profile info
export const useAllSubscriptions = () => {
  const { isAdmin } = useAuthContext();

  return useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: async () => {
      // Get subscriptions
      const { data: subs, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(name, price_yearly)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!subs || subs.length === 0) return [];

      // Get profiles for these users
      const userIds = subs.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      return subs.map(sub => ({
        ...sub,
        profile: profileMap.get(sub.user_id) || null,
      }));
    },
    enabled: isAdmin(),
  });
};

// Admin: Verify subscription
export const useVerifySubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (params: {
      subscriptionId: string;
      approved: boolean;
      adminNotes?: string;
    }) => {
      if (!user?.id) throw new Error('Admin not authenticated');

      const now = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

      const updateData = params.approved ? {
        status: 'active',
        verified_by: user.id,
        verified_at: now.toISOString(),
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        admin_notes: params.adminNotes,
      } : {
        status: 'rejected',
        verified_by: user.id,
        verified_at: now.toISOString(),
        admin_notes: params.adminNotes,
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', params.subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      toast({
        title: variables.approved ? 'Subscription Diaktifkan ✅' : 'Subscription Ditolak ❌',
        description: variables.approved 
          ? 'User sekarang memiliki akses premium'
          : 'Pembayaran ditolak',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal memverifikasi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Admin: Get subscription price setting
export const useSubscriptionPriceSetting = () => {
  return useQuery({
    queryKey: ['subscription-price-setting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'subscription_price_yearly')
        .single();

      if (error) throw error;
      return data;
    },
  });
};

// Admin: Update subscription price
export const useUpdateSubscriptionPrice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newPrice: number) => {
      // Update platform setting
      const { error: settingError } = await supabase
        .from('platform_settings')
        .update({ value: newPrice.toString() })
        .eq('key', 'subscription_price_yearly');

      if (settingError) throw settingError;

      // Also update the active plan
      const { error: planError } = await supabase
        .from('subscription_plans')
        .update({ price_yearly: newPrice })
        .eq('is_active', true);

      if (planError) throw planError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-price-setting'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Harga Diperbarui! 💰',
        description: 'Harga langganan berhasil diubah',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal mengubah harga',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
