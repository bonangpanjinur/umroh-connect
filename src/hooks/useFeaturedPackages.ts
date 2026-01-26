import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface FeaturedPackage {
  id: string;
  package_id: string;
  travel_id: string;
  position: 'home' | 'category' | 'search';
  priority: number;
  credits_used: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  package?: {
    id: string;
    name: string;
    images: string[];
    duration_days: number;
    package_type: string;
    travel?: {
      name: string;
      logo_url: string;
    };
    departures?: {
      price: number;
      departure_date: string;
    }[];
  };
}

export interface FeaturedPricing {
  daily_credits: number;
  weekly_credits: number;
  monthly_credits: number;
  positions: {
    home: number;
    category: number;
    search: number;
  };
}

export interface FeaturedLimits {
  max_per_travel: number;
  max_home_total: number;
  max_category_total: number;
}

// Fetch active featured packages for display
export const useFeaturedPackagesDisplay = (position: string = 'home') => {
  return useQuery({
    queryKey: ['featured-packages-display', position],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('featured_packages')
        .select(`
          *,
          package:packages(
            id, name, images, duration_days, package_type,
            travel:travels(name, logo_url, verified),
            departures(price, departure_date)
          )
        `)
        .eq('position', position)
        .eq('status', 'active')
        .gte('end_date', now)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      // Filter to only show packages from verified travels
      return (data as unknown as FeaturedPackage[]).filter(
        fp => (fp.package?.travel as any)?.verified
      );
    },
  });
};

// Fetch agent's featured packages
export const useAgentFeaturedPackages = (travelId?: string) => {
  return useQuery({
    queryKey: ['agent-featured-packages', travelId],
    queryFn: async () => {
      if (!travelId) return [];

      const { data, error } = await supabase
        .from('featured_packages')
        .select(`
          *,
          package:packages(id, name, images, package_type)
        `)
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as FeaturedPackage[];
    },
    enabled: !!travelId,
  });
};

// Fetch featured package pricing settings
export const useFeaturedPricing = () => {
  return useQuery({
    queryKey: ['featured-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'featured_package_pricing')
        .single();

      if (error) throw error;
      return data.value as unknown as FeaturedPricing;
    },
  });
};

// Fetch featured package limits
export const useFeaturedLimits = () => {
  return useQuery({
    queryKey: ['featured-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'featured_package_limits')
        .single();

      if (error) throw error;
      return data.value as unknown as FeaturedLimits;
    },
  });
};

// Create featured package (purchase)
export const useCreateFeaturedPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      packageId,
      travelId,
      position,
      duration,
      creditsToUse,
    }: {
      packageId: string;
      travelId: string;
      position: 'home' | 'category' | 'search';
      duration: 'daily' | 'weekly' | 'monthly';
      creditsToUse: number;
    }) => {
      // Calculate end date based on duration
      const now = new Date();
      let endDate = new Date();
      
      switch (duration) {
        case 'daily':
          endDate.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          endDate.setDate(now.getDate() + 30);
          break;
      }

      // First check if travel has enough credits
      const { data: credits, error: creditsError } = await supabase
        .from('package_credits')
        .select('credits_remaining')
        .eq('travel_id', travelId)
        .single();

      if (creditsError || !credits || credits.credits_remaining < creditsToUse) {
        throw new Error('Kredit tidak mencukupi. Silakan beli kredit terlebih dahulu.');
      }

      // Deduct credits
      const { error: deductError } = await supabase
        .from('package_credits')
        .update({ 
          credits_remaining: credits.credits_remaining - creditsToUse,
          credits_used: credits.credits_remaining + creditsToUse,
        })
        .eq('travel_id', travelId);

      if (deductError) throw deductError;

      // Record credit transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          travel_id: travelId,
          package_id: packageId,
          amount: -creditsToUse,
          transaction_type: 'usage',
          notes: `Featured package (${position}) - ${duration}`,
        });

      if (transactionError) throw transactionError;

      // Create featured package
      const { data, error } = await supabase
        .from('featured_packages')
        .insert({
          package_id: packageId,
          travel_id: travelId,
          position,
          priority: 10, // Default priority
          credits_used: creditsToUse,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-featured-packages'] });
      queryClient.invalidateQueries({ queryKey: ['featured-packages-display'] });
      queryClient.invalidateQueries({ queryKey: ['agent-credits', variables.travelId] });
    },
  });
};

// Cancel featured package
export const useCancelFeaturedPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (featuredId: string) => {
      const { data, error } = await supabase
        .from('featured_packages')
        .update({ status: 'cancelled' })
        .eq('id', featuredId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-featured-packages'] });
      queryClient.invalidateQueries({ queryKey: ['featured-packages-display'] });
    },
  });
};

// Get featured package stats for admin
export const useFeaturedStats = () => {
  return useQuery({
    queryKey: ['featured-stats'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('featured_packages')
        .select('status, position, credits_used');

      if (error) throw error;

      const active = data.filter(fp => fp.status === 'active');
      const totalCredits = data.reduce((sum, fp) => sum + fp.credits_used, 0);

      return {
        total: data.length,
        active: active.length,
        homeActive: active.filter(fp => fp.position === 'home').length,
        categoryActive: active.filter(fp => fp.position === 'category').length,
        searchActive: active.filter(fp => fp.position === 'search').length,
        totalCreditsUsed: totalCredits,
      };
    },
  });
};
