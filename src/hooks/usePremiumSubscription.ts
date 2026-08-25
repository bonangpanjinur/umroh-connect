import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/coreApi';

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
      const plans = await coreApi.listSubscriptionPlans();
      return plans.map((plan) => ({
        id: String(plan.id), name: String(plan.name), description: plan.description ? String(plan.description) : null,
        price_yearly: Number(plan.price_minor ?? 0), features: Array.isArray(plan.features) ? plan.features.map(String) : [], is_active: true,
      }));
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
      const data = await coreApi.getMySubscription();
      if (!data) return null;
      return { ...data, user_id: user.id, plan_id: data.plan_id ? String(data.plan_id) : null, payment_proof_url: null, payment_amount: null, payment_date: null, verified_by: null, verified_at: null, start_date: data.current_period_start ? String(data.current_period_start) : null, end_date: data.current_period_end ? String(data.current_period_end) : null, admin_notes: null } as UserSubscription;
    },
    enabled: !!user?.id,
  });
};

export const usePremiumPaymentEvents = (page = 1, limit = 25) => useQuery({ queryKey: ['premium-payment-events', page, limit], queryFn: () => coreApi.listMyPremiumPaymentEvents({ page, limit }) });

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
      paymentProofDocumentId: string;
      paymentAmount?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return coreApi.submitPremiumPaymentProof(params.planId, params.paymentProofDocumentId);
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
export interface AdminSubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  payment_amount?: number | null;
  payment_date?: string | null;
  payment_proof_url?: string | null;
  end_date?: string | null;
  admin_notes?: string | null;
  profile?: { full_name?: string | null; email?: string | null } | null;
  plan?: { name?: string | null } | null;
}

export const useAllSubscriptions = () => {
  const { isAdmin } = useAuthContext();

  return useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: async () => {
      const rows = await coreApi.listPlatformAdminMemberships();
      return (rows || []) as unknown as AdminSubscriptionRow[];
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
      return coreApi.updatePlatformMembership(params.subscriptionId, { status: params.approved ? 'active' : 'rejected', notes: params.adminNotes });
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
      const settings = await coreApi.getPlatformAdminSettings() as Array<Record<string, unknown>>;
      return (settings || []).find((setting) => setting.key === 'subscription_price_yearly') || null;
    },
  });
};

// Admin: Update subscription price
export const useUpdateSubscriptionPrice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newPrice: number) => {
      await coreApi.updatePlatformAdminSetting('subscription_price_yearly', newPrice);
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
