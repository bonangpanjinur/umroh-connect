import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  badge?: string;
  limits: {
    maxPackages: number;
    maxTemplates: number;
    monthlyCredits: number;
    hasWebsite: boolean;
    hasPrioritySearch: boolean;
    hasChat: boolean;
    hasLeadStats: boolean;
    hasVerifiedBadge: boolean;
    hasTopListing: boolean;
    hasJamaahData: boolean;
    hasPrioritySupport: boolean;
    hasAdvancedAnalytics: boolean;
  };
}

interface AgentMembership {
  id: string;
  travel_id: string;
  plan_type: string;
  status: string;
  amount: number;
  payment_proof_url: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Available membership plans with clear limits
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Listing 3 paket per bulan',
      'Tampil standar di pencarian',
      'Akses dasar dashboard',
    ],
    limits: {
      maxPackages: 3,
      maxTemplates: 0,
      monthlyCredits: 0,
      hasWebsite: false,
      hasPrioritySearch: false,
      hasChat: false,
      hasLeadStats: false,
      hasVerifiedBadge: false,
      hasTopListing: false,
      hasJamaahData: false,
      hasPrioritySupport: false,
      hasAdvancedAnalytics: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2000000,
    badge: 'Pro',
    features: [
      'Listing 5 paket per bulan',
      'Website agent + 1 template',
      '4 kredit promosi / bulan',
      'Prioritas di pencarian',
      'Bisa balas chat jamaah',
      'Statistik leads lengkap',
      'Support via chat',
    ],
    limits: {
      maxPackages: 5,
      maxTemplates: 1,
      monthlyCredits: 4,
      hasWebsite: true,
      hasPrioritySearch: true,
      hasChat: true,
      hasLeadStats: true,
      hasVerifiedBadge: false,
      hasTopListing: false,
      hasJamaahData: false,
      hasPrioritySupport: false,
      hasAdvancedAnalytics: false,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 7500000,
    badge: 'Verified ✓',
    features: [
      'Listing 10 paket per bulan',
      'Website agent + 3 template',
      '10 kredit promosi / bulan',
      'Semua fitur Pro',
      'Badge "Verified" di profil',
      'Top listing / rekomendasi',
      'Akses data calon jamaah',
      'Support prioritas 24/7',
      'Analitik advanced',
    ],
    limits: {
      maxPackages: 10,
      maxTemplates: 3,
      monthlyCredits: 10,
      hasWebsite: true,
      hasPrioritySearch: true,
      hasChat: true,
      hasLeadStats: true,
      hasVerifiedBadge: true,
      hasTopListing: true,
      hasJamaahData: true,
      hasPrioritySupport: true,
      hasAdvancedAnalytics: true,
    },
  },
];

// Fetch agent's current membership
export const useAgentMembership = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-membership', travelId],
    queryFn: async (): Promise<AgentMembership | null> => {
      if (!travelId) return null;

      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AgentMembership | null;
    },
    enabled: !!travelId,
  });
};

// Check if agent has active membership
export const useIsAgentPro = (travelId: string | undefined) => {
  const { data: membership, isLoading } = useAgentMembership(travelId);

  const isActive = membership?.status === 'active' &&
    membership?.end_date &&
    new Date(membership.end_date) > new Date();

  const planType = isActive ? membership?.plan_type || 'free' : 'free';
  const isPro = isActive && (planType === 'pro' || planType === 'premium');
  const isPremium = isActive && planType === 'premium';
  const currentPlan = MEMBERSHIP_PLANS.find(p => p.id === planType) || MEMBERSHIP_PLANS[0];

  return { 
    isLoading, 
    membership, 
    planType, 
    isPro, 
    isPremium,
    isActive,
    currentPlan,
  };
};

// Request membership upgrade
export const useRequestMembership = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      travelId: string;
      planType: string;
      amount: number;
      paymentProofUrl: string;
    }) => {
      const { data, error } = await supabase
        .from('memberships')
        .insert({
          travel_id: params.travelId,
          plan_type: params.planType,
          status: 'pending',
          amount: params.amount,
          payment_proof_url: params.paymentProofUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-membership'] });
      toast({
        title: 'Pengajuan Berhasil! 🎉',
        description: 'Mohon tunggu verifikasi dari admin (1-24 jam)',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal mengajukan',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Get remaining days of membership
export const getMembershipDaysRemaining = (endDate: string | null): number => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Helper to get plan by ID
export const getPlanById = (planId: string): MembershipPlan => {
  return MEMBERSHIP_PLANS.find(p => p.id === planId) || MEMBERSHIP_PLANS[0];
};
