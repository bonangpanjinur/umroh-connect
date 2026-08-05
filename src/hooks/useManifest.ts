import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type Gender = 'L' | 'P';
export type RoomType = 'double' | 'triple' | 'quad';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pending: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export const ROOM_CAPACITY: Record<RoomType, number> = {
  double: 2,
  triple: 3,
  quad: 4,
};

export interface ManifestPilgrim {
  id: string;
  booking_id: string;
  departure_id: string | null;
  travel_id: string;
  full_name: string;
  gender: Gender;
  birth_date: string | null;
  nik: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  phone: string | null;
  mahram_name: string | null;
  room_type: RoomType;
  room_number: string | null;
  bus_number: string | null;
  notes: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  booking?: {
    booking_code: string;
    contact_name: string;
    status: string;
  };
}

export interface AgentDepartureOption {
  id: string;
  departure_date: string;
  return_date: string;
  total_seats: number;
  available_seats: number;
  status: string;
  package_id: string;
  package_name: string;
}

// All departures owned by the travel (for manifest selector)
export const useAgentDepartures = (travelId?: string) => {
  return useQuery({
    queryKey: ['agent-departures-all', travelId],
    queryFn: async (): Promise<AgentDepartureOption[]> => {
      if (!travelId) return [];
      const { data, error } = await (supabase as any)
        .from('departures')
        .select('id, departure_date, return_date, total_seats, available_seats, status, package_id, packages!inner(name, travel_id)')
        .eq('packages.travel_id', travelId)
        .order('departure_date', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        departure_date: d.departure_date,
        return_date: d.return_date,
        total_seats: d.total_seats,
        available_seats: d.available_seats,
        status: d.status,
        package_id: d.package_id,
        package_name: d.packages?.name || 'Paket',
      }));
    },
    enabled: !!travelId,
  });
};

export const useManifestPilgrims = (departureId?: string) => {
  return useQuery({
    queryKey: ['manifest-pilgrims', departureId],
    queryFn: async (): Promise<ManifestPilgrim[]> => {
      if (!departureId) return [];
      const { data, error } = await (supabase as any)
        .from('manifest_pilgrims')
        .select('*, booking:bookings(booking_code, contact_name, status)')
        .eq('departure_id', departureId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return (data || []) as ManifestPilgrim[];
    },
    enabled: !!departureId,
  });
};

// Bookings of a departure (source for importing manifest entries)
export const useDepartureBookings = (departureId?: string) => {
  return useQuery({
    queryKey: ['departure-bookings', departureId],
    queryFn: async () => {
      if (!departureId) return [];
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select('id, booking_code, contact_name, contact_phone, number_of_pilgrims, status, travel_id')
        .eq('departure_id', departureId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!departureId,
  });
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['manifest-pilgrims'] });
};

export const useSaveManifestPilgrim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ManifestPilgrim> & { travel_id: string; booking_id: string; full_name: string }) => {
      if (payload.id) {
        const { id, booking, ...rest } = payload as any;
        const { error } = await (supabase as any).from('manifest_pilgrims').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { booking, ...rest } = payload as any;
      const { data, error } = await (supabase as any).from('manifest_pilgrims').insert([rest]).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      invalidate(qc);
      toast({ title: 'Data jemaah tersimpan' });
    },
    onError: (e: any) => toast({ title: 'Gagal menyimpan', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteManifestPilgrim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('manifest_pilgrims').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate(qc);
      toast({ title: 'Jemaah dihapus dari manifest' });
    },
    onError: (e: any) => toast({ title: 'Gagal menghapus', description: e.message, variant: 'destructive' }),
  });
};

export const useBulkInsertManifest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Array<Partial<ManifestPilgrim>>) => {
      if (rows.length === 0) return 0;
      const { error } = await (supabase as any).from('manifest_pilgrims').insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      invalidate(qc);
      toast({ title: `${count} baris jemaah ditambahkan dari booking` });
    },
    onError: (e: any) => toast({ title: 'Gagal import dari booking', description: e.message, variant: 'destructive' }),
  });
};

export const useBulkUpdateRooming = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Array<{ id: string; room_number: string | null; room_type?: RoomType }>) => {
      for (const u of updates) {
        const { id, ...rest } = u;
        const { error } = await (supabase as any).from('manifest_pilgrims').update(rest).eq('id', id);
        if (error) throw error;
      }
      return updates.length;
    },
    onSuccess: (count) => {
      invalidate(qc);
      toast({ title: `Rooming list diperbarui (${count} jemaah)` });
    },
    onError: (e: any) => toast({ title: 'Gagal menyusun rooming list', description: e.message, variant: 'destructive' }),
  });
};

// Approval flow: only approved pilgrims may enter rooming list / exports
export const useSetManifestApproval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
      reason,
    }: { ids: string[]; status: ApprovalStatus; reason?: string | null }) => {
      if (ids.length === 0) return { count: 0, status };
      const { error } = await (supabase as any)
        .from('manifest_pilgrims')
        .update({
          approval_status: status,
          rejection_reason: status === 'rejected' ? (reason || null) : null,
        })
        .in('id', ids);
      if (error) throw error;
      return { count: ids.length, status };
    },
    onSuccess: ({ count, status }) => {
      invalidate(qc);
      toast({
        title:
          status === 'approved'
            ? `${count} jemaah disetujui masuk manifest final`
            : status === 'rejected'
            ? `${count} jemaah ditolak`
            : `${count} jemaah dikembalikan ke status menunggu`,
      });
    },
    onError: (e: any) => toast({ title: 'Gagal memperbarui persetujuan', description: e.message, variant: 'destructive' }),
  });
};

export const isApproved = (p: ManifestPilgrim) => p.approval_status === 'approved';



// Group pilgrims into rooms by gender, respecting room capacity.
export const buildRoomingAssignments = (
  pilgrims: ManifestPilgrim[],
  roomType: RoomType
): Array<{ id: string; room_number: string; room_type: RoomType }> => {
  const capacity = ROOM_CAPACITY[roomType];
  const result: Array<{ id: string; room_number: string; room_type: RoomType }> = [];
  let roomIndex = 1;

  (['L', 'P'] as Gender[]).forEach((gender) => {
    const group = pilgrims.filter((p) => p.gender === gender);
    for (let i = 0; i < group.length; i += capacity) {
      const chunk = group.slice(i, i + capacity);
      const roomNumber = `${gender === 'L' ? 'L' : 'P'}-${String(roomIndex).padStart(2, '0')}`;
      chunk.forEach((p) => result.push({ id: p.id, room_number: roomNumber, room_type: roomType }));
      roomIndex++;
    }
  });

  return result;
};
