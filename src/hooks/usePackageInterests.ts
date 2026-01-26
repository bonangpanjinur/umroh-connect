import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

// Generate or retrieve session ID for anonymous tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('package_interest_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('package_interest_session', sessionId);
  }
  return sessionId;
};

export interface PackageInterest {
  id: string;
  package_id: string;
  departure_id: string | null;
  user_id: string | null;
  interest_type: 'view' | 'whatsapp_click' | 'inquiry';
  session_id: string | null;
  created_at: string;
}

export interface PackageStats {
  package_id: string;
  package_name: string;
  total_views: number;
  whatsapp_clicks: number;
  unique_users: number;
  last_interest_at: string | null;
}

// Track package interest
export const useTrackInterest = () => {
  const { user } = useAuthContext();
  
  return useMutation({
    mutationFn: async ({ 
      packageId, 
      departureId, 
      interestType 
    }: { 
      packageId: string; 
      departureId?: string; 
      interestType: 'view' | 'whatsapp_click' | 'inquiry';
    }) => {
      // Use type assertion since table was just created and types not regenerated yet
      const { error } = await (supabase as any)
        .from('package_interests')
        .insert({
          package_id: packageId,
          departure_id: departureId || null,
          user_id: user?.id || null,
          interest_type: interestType,
          session_id: user ? null : getSessionId(),
        });

      if (error) throw error;
    },
  });
};

// Get package stats for agent's travel
export const usePackageStats = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['package-stats', travelId],
    queryFn: async () => {
      if (!travelId) return [];

      // First get packages for this travel
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('id, name')
        .eq('travel_id', travelId);

      if (packagesError) throw packagesError;
      if (!packages || packages.length === 0) return [];

      const packageIds = packages.map(p => p.id);

      // Get interests for these packages (use type assertion for newly created table)
      const { data: interests, error: interestsError } = await (supabase as any)
        .from('package_interests')
        .select('*')
        .in('package_id', packageIds) as { data: PackageInterest[] | null; error: any };

      if (interestsError) throw interestsError;

      // Aggregate stats per package
      const stats: PackageStats[] = packages.map(pkg => {
        const pkgInterests = interests?.filter(i => i.package_id === pkg.id) || [];
        
        const uniqueUsers = new Set(
          pkgInterests
            .filter(i => i.user_id || i.session_id)
            .map(i => i.user_id || i.session_id)
        );

        const lastInterest = pkgInterests.length > 0
          ? pkgInterests.reduce((latest, curr) => 
              new Date(curr.created_at) > new Date(latest.created_at) ? curr : latest
            )
          : null;

        return {
          package_id: pkg.id,
          package_name: pkg.name,
          total_views: pkgInterests.filter(i => i.interest_type === 'view').length,
          whatsapp_clicks: pkgInterests.filter(i => i.interest_type === 'whatsapp_click').length,
          unique_users: uniqueUsers.size,
          last_interest_at: lastInterest?.created_at || null,
        };
      });

      return stats.sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks);
    },
    enabled: !!travelId,
  });
};

// Get recent interests for realtime display
export const useRecentInterests = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['recent-interests', travelId],
    queryFn: async () => {
      if (!travelId) return [];

      // Get packages for this travel
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('id, name')
        .eq('travel_id', travelId);

      if (packagesError) throw packagesError;
      if (!packages || packages.length === 0) return [];

      const packageIds = packages.map(p => p.id);

      // Get recent interests (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: interests, error: interestsError } = await (supabase as any)
        .from('package_interests')
        .select('*')
        .in('package_id', packageIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20) as { data: (PackageInterest & { package_name?: string })[] | null; error: any };

      if (interestsError) throw interestsError;

      // Enrich with package names
      return (interests || []).map(interest => ({
        ...interest,
        package_name: packages.find(p => p.id === interest.package_id)?.name || 'Unknown',
      }));
    },
    enabled: !!travelId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Get interest trend data for charts
export const useInterestTrend = (travelId: string | undefined, days: number = 7) => {
  return useQuery({
    queryKey: ['interest-trend', travelId, days],
    queryFn: async () => {
      if (!travelId) return [];

      // Get packages for this travel
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('id')
        .eq('travel_id', travelId);

      if (packagesError) throw packagesError;
      if (!packages || packages.length === 0) return [];

      const packageIds = packages.map(p => p.id);

      // Get interests for the period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: interests, error: interestsError } = await (supabase as any)
        .from('package_interests')
        .select('created_at, interest_type')
        .in('package_id', packageIds)
        .gte('created_at', startDate.toISOString()) as { data: { created_at: string; interest_type: string }[] | null; error: any };

      if (interestsError) throw interestsError;

      // Group by date
      const grouped: Record<string, { views: number; clicks: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        grouped[dateStr] = { views: 0, clicks: 0 };
      }

      interests?.forEach(interest => {
        const dateStr = interest.created_at.split('T')[0];
        if (grouped[dateStr]) {
          if (interest.interest_type === 'view') {
            grouped[dateStr].views++;
          } else if (interest.interest_type === 'whatsapp_click') {
            grouped[dateStr].clicks++;
          }
        }
      });

      return Object.entries(grouped).map(([date, stats]) => ({
        date,
        views: stats.views,
        clicks: stats.clicks,
      }));
    },
    enabled: !!travelId,
  });
};
