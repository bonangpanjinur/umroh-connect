import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';

export interface FeaturedPackage { id: string; package_id: string; travel_id: string; position: 'home' | 'category' | 'search'; priority: number; credits_used: number; start_date: string; end_date: string; status: 'active' | 'expired' | 'cancelled'; created_at: string; package?: { id: string; name: string; images: string[]; duration_days: number; package_type: string; travel?: { name: string; logo_url: string }; departures?: { price: number; departure_date: string }[] }; }
export interface FeaturedPricing { daily_credits: number; weekly_credits: number; monthly_credits: number; positions: { home: number; category: number; search: number } }
export interface FeaturedLimits { max_per_travel: number; max_home_total: number; max_category_total: number }

export const useFeaturedPackagesDisplay = (position: string = 'home') => useQuery({
  queryKey: ['featured-packages-display', position],
  queryFn: async () => coreApi.listFeaturedPackages(position) as unknown as FeaturedPackage[],
});

export const useAgentFeaturedPackages = (travelId?: string) => useQuery({
  queryKey: ['agent-featured-packages', travelId],
  queryFn: async () => travelId ? await coreApi.listAgentFeaturedPackages(travelId) as unknown as FeaturedPackage[] : [],
  enabled: !!travelId,
});

export const useFeaturedPricing = () => useQuery({
  queryKey: ['featured-pricing'],
  queryFn: async (): Promise<FeaturedPricing> => ({ daily_credits: 1, weekly_credits: 7, monthly_credits: 30, positions: { home: 1, category: 1, search: 1 } }),
});

export const useFeaturedLimits = () => useQuery({
  queryKey: ['featured-limits'],
  queryFn: async (): Promise<FeaturedLimits> => ({ max_per_travel: 10, max_home_total: 10, max_category_total: 50 }),
});

export const useCreateFeaturedPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { packageId: string; travelId: string; position: 'home' | 'category' | 'search'; duration: 'daily' | 'weekly' | 'monthly'; creditsToUse: number }) => coreApi.createFeaturedPackage({ package_id: input.packageId, travel_id: input.travelId, position: input.position, duration: input.duration, credits_to_use: input.creditsToUse }),
    onSuccess: (_, variables) => { void queryClient.invalidateQueries({ queryKey: ['agent-featured-packages', variables.travelId] }); void queryClient.invalidateQueries({ queryKey: ['featured-packages-display'] }); void queryClient.invalidateQueries({ queryKey: ['agent-credits', variables.travelId] }); },
  });
};

export const useCancelFeaturedPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (featuredId: string) => coreApi.cancelFeaturedPackage(featuredId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['agent-featured-packages'] }); void queryClient.invalidateQueries({ queryKey: ['featured-packages-display'] }); },
  });
};

export const useFeaturedStats = () => useQuery({
  queryKey: ['featured-stats'],
  queryFn: async () => {
    const data = await coreApi.listFeaturedPackages();
    const active = data.filter((fp) => fp.status === 'active');
    return { total: data.length, active: active.length, homeActive: active.filter((fp) => fp.position === 'home').length, categoryActive: active.filter((fp) => fp.position === 'category').length, searchActive: active.filter((fp) => fp.position === 'search').length, totalCreditsUsed: data.reduce((sum, fp) => sum + Number(fp.credits_used || 0), 0) };
  },
});
