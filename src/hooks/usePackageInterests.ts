import { useMutation, useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { useAuthContext } from '@/contexts/AuthContext';

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
  inquiries: number;
  unique_users: number;
  last_interest_at: string | null;
}

export const useTrackInterest = () => {
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ packageId, departureId, interestType }: {
      packageId: string;
      departureId?: string;
      interestType: 'view' | 'whatsapp_click' | 'inquiry';
    }) => coreApi.recordMarketplaceAnalyticsEvent({
      package_id: packageId,
      departure_id: departureId,
      event_type: interestType,
      session_id: user ? undefined : getSessionId(),
      metadata: { surface: 'package-detail' },
    }),
  });
};

export const usePackageStats = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['package-stats', 'core-analytics', travelId],
    queryFn: async (): Promise<PackageStats[]> => {
      if (!travelId) return [];
      const data = await coreApi.getManagementMarketplaceAnalytics({ days: 30, limit: 100 });
      return data.package_stats.map((item) => ({
        package_id: item.package_id,
        package_name: item.package_name,
        total_views: item.total_views,
        whatsapp_clicks: item.whatsapp_clicks,
        inquiries: item.inquiries,
        unique_users: item.unique_visitors,
        last_interest_at: item.last_event_at,
      }));
    },
    enabled: !!travelId,
  });
};

export const useRecentInterests = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['recent-interests', 'core-analytics', travelId],
    queryFn: async () => {
      if (!travelId) return [];
      const data = await coreApi.getManagementMarketplaceAnalytics({ days: 7, limit: 20 });
      return data.recent.map((event) => ({
        id: event.event_id,
        package_id: event.package_id,
        package_name: event.package_name,
        departure_id: event.departure_id,
        user_id: null,
        interest_type: event.event_type as PackageInterest['interest_type'],
        session_id: null,
        created_at: event.created_at,
      }));
    },
    enabled: !!travelId,
    refetchInterval: 30000,
  });
};

export const useInterestTrend = (travelId: string | undefined, days: number = 7) => {
  return useQuery({
    queryKey: ['interest-trend', 'core-analytics', travelId, days],
    queryFn: async () => {
      if (!travelId) return [];
      const data = await coreApi.getManagementMarketplaceAnalytics({ days, limit: 100 });
      const grouped: Record<string, { views: number; clicks: number; inquiries: number }> = {};
      for (let i = 0; i < days; i += 1) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        grouped[date.toISOString().split('T')[0]] = { views: 0, clicks: 0, inquiries: 0 };
      }
      data.trend.forEach((item) => {
        if (grouped[item.date]) grouped[item.date] = { views: item.views, clicks: item.clicks, inquiries: item.inquiries };
      });
      return Object.entries(grouped).map(([date, stats]) => ({ date, ...stats }));
    },
    enabled: !!travelId,
  });
};
