import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { toast } from '@/hooks/use-toast';

export type Gender = 'L' | 'P';
export type RoomType = 'double' | 'triple' | 'quad';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = { pending: 'Menunggu Verifikasi', approved: 'Disetujui', rejected: 'Ditolak' };
export const ROOM_CAPACITY: Record<RoomType, number> = { double: 2, triple: 3, quad: 4 };

export interface ManifestPilgrim {
  id: string; booking_id: string; departure_id: string | null; travel_id: string; full_name: string; gender: Gender;
  birth_date: string | null; nik: string | null; passport_number: string | null; passport_expiry: string | null;
  phone: string | null; mahram_name: string | null; room_type: RoomType; room_number: string | null; bus_number: string | null;
  notes: string | null; approval_status: ApprovalStatus; approved_at: string | null; approved_by: string | null;
  rejection_reason: string | null; created_at: string; updated_at: string;
  booking?: { booking_code: string; contact_name: string; status: string };
}
export interface AgentDepartureOption { id: string; departure_date: string; return_date: string; total_seats: number; available_seats: number; status: string; package_id: string; package_name: string; }

const unwrap = <T,>(value: unknown) => value as T;
const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: ['manifest-pilgrims'] });

export const useAgentDepartures = (travelId?: string) => useQuery({
  queryKey: ['agent-departures-all', 'core', travelId],
  queryFn: async (): Promise<AgentDepartureOption[]> => travelId ? unwrap<AgentDepartureOption[]>(await coreApi.listManagementDeparturesForManifest()) : [],
  enabled: !!travelId,
});

export const useManifestPilgrims = (departureId?: string) => useQuery({
  queryKey: ['manifest-pilgrims', departureId],
  queryFn: async (): Promise<ManifestPilgrim[]> => departureId ? unwrap<ManifestPilgrim[]>(await coreApi.listManagementManifest(departureId, { limit: 100 })) : [],
  enabled: !!departureId,
});

export const useDepartureBookings = (departureId?: string) => useQuery({
  queryKey: ['departure-bookings', departureId],
  queryFn: async () => departureId ? await coreApi.listManagementDepartureBookings(departureId) : [],
  enabled: !!departureId,
});

export const useSaveManifestPilgrim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ManifestPilgrim> & { travel_id?: string; booking_id: string; departure_id: string; full_name: string }) => {
      const { id, booking, travel_id: _travelId, ...rest } = payload as Record<string, unknown>;
      return id ? coreApi.updateManagementManifest(String(id), rest) : coreApi.createManagementManifest(rest);
    },
    onSuccess: () => { invalidate(qc); toast({ title: 'Data jemaah tersimpan' }); },
    onError: (e: any) => toast({ title: 'Gagal menyimpan', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteManifestPilgrim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coreApi.deleteManagementManifest(id),
    onSuccess: () => { invalidate(qc); toast({ title: 'Jemaah dihapus dari manifest' }); },
    onError: (e: any) => toast({ title: 'Gagal menghapus', description: e.message, variant: 'destructive' }),
  });
};

export const useBulkInsertManifest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<Partial<ManifestPilgrim>>) => coreApi.bulkCreateManagementManifest(rows as Array<Record<string, unknown>>),
    onSuccess: (result: any) => { invalidate(qc); toast({ title: `${result?.count ?? 0} baris jemaah ditambahkan dari booking` }); },
    onError: (e: any) => toast({ title: 'Gagal import dari booking', description: e.message, variant: 'destructive' }),
  });
};

export const useBulkUpdateRooming = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Array<{ id: string; room_number: string | null; room_type?: RoomType }>) => {
      const result = await coreApi.bulkUpdateManifestRooming(updates);
      return Number((result as { count?: number })?.count ?? updates.length);
    },
    onSuccess: (count) => { invalidate(qc); toast({ title: `Rooming list diperbarui (${count} jemaah)` }); },
    onError: (e: any) => toast({ title: 'Gagal menyusun rooming list', description: e.message, variant: 'destructive' }),
  });
};

export const useSetManifestApproval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status, reason }: { ids: string[]; status: ApprovalStatus; reason?: string | null }) => {
      const result = await coreApi.bulkUpdateManifestApproval(ids, status, reason);
      return { count: Number((result as { count?: number })?.count ?? ids.length), status };
    },
    onSuccess: ({ count, status }) => { invalidate(qc); toast({ title: status === 'approved' ? `${count} jemaah disetujui masuk manifest final` : status === 'rejected' ? `${count} jemaah ditolak` : `${count} jemaah dikembalikan ke status menunggu` }); },
    onError: (e: any) => toast({ title: 'Gagal memperbarui persetujuan', description: e.message, variant: 'destructive' }),
  });
};

export const isApproved = (p: ManifestPilgrim) => p.approval_status === 'approved';

export const buildRoomingAssignments = (pilgrims: ManifestPilgrim[], roomType: RoomType) => {
  const capacity = ROOM_CAPACITY[roomType];
  const result: Array<{ id: string; room_number: string; room_type: RoomType }> = [];
  let roomIndex = 1;
  (['L', 'P'] as Gender[]).forEach((gender) => {
    const group = pilgrims.filter((p) => p.gender === gender);
    for (let i = 0; i < group.length; i += capacity) {
      const roomNumber = `${gender}-${String(roomIndex).padStart(2, '0')}`;
      group.slice(i, i + capacity).forEach((p) => result.push({ id: p.id, room_number: roomNumber, room_type: roomType }));
      roomIndex += 1;
    }
  });
  return result;
};
