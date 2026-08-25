import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { Travel, Package, Departure } from '@/types/database';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { tenantScopeKey, useTenantScope } from '@/hooks/useTenantScope';

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const useAgentTravel = () => {
  const { profile } = useAuthContext();
  return useQuery({ queryKey: ['agent-travel', profile?.id], queryFn: async () => profile?.id ? await coreApi.getManagementTravel() as unknown as Travel : null, enabled: !!profile?.id });
};

export const useCreateTravel = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (travelData: Partial<Travel>) => coreApi.updateManagementTravel(asRecord(travelData)) as unknown as Promise<Travel>, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-travel'] }); toast({ title: 'Profil travel berhasil disimpan!' }); }, onError: (error: any) => toast({ title: 'Gagal menyimpan profil travel', description: error.message, variant: 'destructive' }) });
};

export const useUpdateTravel = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ id: _id, ...data }: Partial<Travel> & { id: string }) => coreApi.updateManagementTravel(asRecord(data)) as unknown as Promise<Travel>, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-travel'] }); toast({ title: 'Profil travel berhasil diupdate!' }); }, onError: (error: any) => toast({ title: 'Gagal update travel', description: error.message, variant: 'destructive' }) });
};

export const useAgentPackages = (travelId?: string) => { const { data: scope } = useTenantScope(); return useQuery({ queryKey: ['agent-packages', tenantScopeKey(scope), travelId], queryFn: async () => travelId ? await coreApi.listManagementPackages() as Package[] : [], enabled: !!travelId && !!scope?.tenant_id }); };

export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (data: Partial<Package>) => coreApi.createManagementPackage(asRecord(data)) as unknown as Promise<Package>, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-packages'] }); queryClient.invalidateQueries({ queryKey: ['packages'] }); toast({ title: 'Paket berhasil dibuat!' }); }, onError: (error: any) => toast({ title: 'Gagal membuat paket', description: error.message, variant: 'destructive' }) });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...data }: Partial<Package> & { id: string }) => coreApi.updateManagementPackage(id, asRecord(data)) as unknown as Promise<Package>, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-packages'] }); queryClient.invalidateQueries({ queryKey: ['packages'] }); toast({ title: 'Paket berhasil diupdate!' }); }, onError: (error: any) => toast({ title: 'Gagal update paket', description: error.message, variant: 'destructive' }) });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => coreApi.archiveManagementPackage(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agent-packages'] }); queryClient.invalidateQueries({ queryKey: ['packages'] }); toast({ title: 'Paket berhasil diarsipkan!' }); }, onError: (error: any) => toast({ title: 'Gagal mengarsipkan paket', description: error.message, variant: 'destructive' }) });
};

export const usePackageDepartures = (packageId?: string) => { const { data: scope } = useTenantScope(); return useQuery({ queryKey: ['package-departures', tenantScopeKey(scope), packageId], queryFn: async () => packageId ? await coreApi.listManagementPackageDepartures(packageId) as Departure[] : [], enabled: !!packageId && !!scope?.tenant_id }); };

export const useCreateDeparture = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ packageId, ...data }: Partial<Departure> & { packageId: string }) => coreApi.createManagementDeparture(packageId, asRecord(data)) as unknown as Promise<Departure>, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['package-departures'] }); queryClient.invalidateQueries({ queryKey: ['packages'] }); toast({ title: 'Jadwal keberangkatan berhasil ditambah!' }); }, onError: (error: any) => toast({ title: 'Gagal menambah jadwal', description: error.message, variant: 'destructive' }) });
};

export const useUpdateDeparture = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...data }: Partial<Departure> & { id: string }) => coreApi.updateManagementDeparture(id, asRecord(data)) as unknown as Promise<Departure>, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['package-departures'] }); queryClient.invalidateQueries({ queryKey: ['packages'] }); toast({ title: 'Jadwal berhasil diupdate!' }); }, onError: (error: any) => toast({ title: 'Gagal update jadwal', description: error.message, variant: 'destructive' }) });
};

export const useDeleteDeparture = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => coreApi.archiveManagementDeparture(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['package-departures'] }); queryClient.invalidateQueries({ queryKey: ['packages'] }); toast({ title: 'Jadwal berhasil diarsipkan!' }); }, onError: (error: any) => toast({ title: 'Gagal mengarsipkan jadwal', description: error.message, variant: 'destructive' }) });
};
