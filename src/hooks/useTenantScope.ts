import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { coreApi } from '@/lib/coreApi';
import { useAuthContext } from '@/contexts/AuthContext';

export const tenantScopeKey = (scope: { tenant_id?: string | null; branch_ids?: string[] | null } | null | undefined) => [scope?.tenant_id || 'unresolved', ...(scope?.branch_ids || []).slice().sort()] as const;

export const useTenantScope = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['tenant-context', user?.id],
    queryFn: () => coreApi.getTenantContext(),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const previousScope = useRef<{ tenant_id?: string; branch_ids?: string[] } | null>(null);
  useEffect(() => {
    const next = query.data;
    const previous = previousScope.current;
    previousScope.current = next || null;
    if (!previous || !next) return;
    const changed = previous.tenant_id !== next.tenant_id || JSON.stringify(previous.branch_ids || []) !== JSON.stringify(next.branch_ids || []);
    if (changed) {
      void queryClient.removeQueries({ predicate: (entry) => {
        const key = entry.queryKey[0];
        return ['bookings', 'booking', 'payment-schedules', 'payment-notifications', 'departures', 'package-departures', 'departure-itinerary', 'jamaah-manifest', 'manifest-pilgrims'].includes(String(key));
      }});
    }
  }, [query.data, queryClient]);

  return { ...query, scopeKey: tenantScopeKey(query.data) };
};
