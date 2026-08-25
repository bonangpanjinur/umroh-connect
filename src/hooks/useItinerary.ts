import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { useToast } from '@/hooks/use-toast';
import { tenantScopeKey, useTenantScope } from '@/hooks/useTenantScope';

export interface ItineraryDay { id: string; departure_id: string; day_number: number; date?: string | null; title: string; description: string | null; city: string | null; activities: string[] | null; location?: string | null; sort_order?: number; }
const queryKey = (scopeKey: readonly string[], departureId?: string | null) => ['departure-itinerary', ...scopeKey, departureId] as const;

export const useDepartureItinerary = (departureId?: string | null) => {
  const { data: scope } = useTenantScope();
  const scopeKey = tenantScopeKey(scope);
  return useQuery({ queryKey: queryKey(scopeKey, departureId), queryFn: async (): Promise<ItineraryDay[]> => { if (!departureId) return []; return await coreApi.listManagementItinerary(departureId) as unknown as ItineraryDay[]; }, enabled: !!departureId && !!scope?.tenant_id });
};

export const useSaveItineraryDay = (departureId?: string | null) => {
  const queryClient = useQueryClient(); const { toast } = useToast(); const { data: scope } = useTenantScope(); const scopeKey = tenantScopeKey(scope);
  return useMutation({ mutationFn: async (day: { id?: string; day_number: number; date?: string | null; title: string; description?: string | null; city?: string | null; location?: string | null; activities?: string[]; sort_order?: number; }) => { if (!departureId) throw new Error('Jadwal keberangkatan tidak ditemukan.'); return coreApi.upsertManagementItinerary(departureId, { day_number: day.day_number, date: day.date ?? null, title: day.title, description: day.description ?? null, city: day.city ?? null, location: day.location ?? null, activities: day.activities ?? [], sort_order: day.sort_order ?? 0 }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKey(scopeKey, departureId) }); toast({ title: 'Itinerary tersimpan' }); }, onError: (error: any) => toast({ title: 'Gagal menyimpan itinerary', description: error?.message, variant: 'destructive' }) });
};

export const useDeleteItineraryDay = (departureId?: string | null) => {
  const queryClient = useQueryClient(); const { toast } = useToast(); const { data: scope } = useTenantScope(); const scopeKey = tenantScopeKey(scope);
  return useMutation({ mutationFn: async (id: string) => { if (!departureId) throw new Error('Jadwal keberangkatan tidak ditemukan.'); return coreApi.deleteManagementItinerary(departureId, id); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKey(scopeKey, departureId) }); toast({ title: 'Hari dihapus dari itinerary' }); }, onError: (error: any) => toast({ title: 'Gagal menghapus', description: error?.message, variant: 'destructive' }) });
};
