import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { tenantScopeKey, useTenantScope } from '@/hooks/useTenantScope';

export interface ItineraryDay {
  id: string;
  departure_id: string;
  day_number: number;
  title: string;
  description: string | null;
  city: string | null;
  activities: string[] | null;
}

export const useDepartureItinerary = (departureId?: string | null) => {
  const { data: scope } = useTenantScope();
  const scopeKey = tenantScopeKey(scope);
  return useQuery({
    queryKey: ['departure-itinerary', scopeKey, departureId],
    queryFn: async (): Promise<ItineraryDay[]> => {
      if (!departureId) return [];
      const { data, error } = await (supabase as any)
        .from('departure_itineraries')
        .select('*')
        .eq('departure_id', departureId)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return (data || []) as ItineraryDay[];
    },
    enabled: !!departureId && !!scope?.tenant_id,
  });
};

export const useSaveItineraryDay = (departureId?: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: scope } = useTenantScope();
  const scopeKey = tenantScopeKey(scope);

  return useMutation({
    mutationFn: async (day: {
      id?: string;
      day_number: number;
      title: string;
      description?: string | null;
      city?: string | null;
      activities?: string[];
    }) => {
      if (!departureId) throw new Error('Jadwal keberangkatan tidak ditemukan.');
      const payload = {
        departure_id: departureId,
        day_number: day.day_number,
        title: day.title,
        description: day.description || null,
        city: day.city || null,
        activities: day.activities || [],
      };

      if (day.id) {
        const { error } = await (supabase as any)
          .from('departure_itineraries')
          .update(payload)
          .eq('id', day.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('departure_itineraries')
          .upsert(payload, { onConflict: 'departure_id,day_number' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departure-itinerary', scopeKey, departureId] });
      toast({ title: 'Itinerary tersimpan' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal menyimpan itinerary', description: error?.message, variant: 'destructive' });
    },
  });
};

export const useDeleteItineraryDay = (departureId?: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: scope } = useTenantScope();
  const scopeKey = tenantScopeKey(scope);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('departure_itineraries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departure-itinerary', scopeKey, departureId] });
      toast({ title: 'Hari dihapus dari itinerary' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal menghapus', description: error?.message, variant: 'destructive' });
    },
  });
};
