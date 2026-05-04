import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseUntyped as supabase } from '@/lib/supabase';

/**
 * Subscribe to realtime departure changes for a given package and
 * invalidate react-query caches so the UI updates instantly.
 */
export const useDeparturesRealtime = (packageId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!packageId) return;

    const channel = supabase
      .channel(`departures-${packageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departures',
          filter: `package_id=eq.${packageId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['package-departures', packageId] });
          queryClient.invalidateQueries({ queryKey: ['packages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [packageId, queryClient]);
};
