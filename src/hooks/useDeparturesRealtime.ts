import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { tenantScopeKey, useTenantScope } from '@/hooks/useTenantScope';

/**
 * Core is the source of truth for departures. Supabase postgres_changes is not
 * used here because it bypasses Core tenant/branch authorization. The hook
 * performs a lightweight Core-backed cache refresh while the screen is open.
 */
export const useDeparturesRealtime = (packageId: string | undefined) => {
  const queryClient = useQueryClient();
  const { data: scope } = useTenantScope();
  const scopeKey = tenantScopeKey(scope);

  useEffect(() => {
    if (!packageId) return;
    let disposed = false;
    const refresh = async () => {
      try {
        await coreApi.listManagementPackageDepartures(packageId);
        if (!disposed) {
          await queryClient.invalidateQueries({ queryKey: ['package-departures', scopeKey, packageId] });
          await queryClient.invalidateQueries({ queryKey: ['agent-packages', scopeKey] });
        }
      } catch {
        // The owning query remains responsible for presenting the API error.
      }
    };
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [packageId, queryClient, scopeKey]);
};
