import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ManifestAuditAction =
  | 'created'
  | 'updated'
  | 'approved'
  | 'rejected'
  | 'reset_pending'
  | 'deleted';

export interface ManifestAuditEntry {
  id: string;
  pilgrim_id: string | null;
  departure_id: string | null;
  travel_id: string;
  booking_id: string | null;
  pilgrim_name: string | null;
  action: ManifestAuditAction;
  old_approval_status: string | null;
  new_approval_status: string | null;
  rejection_reason: string | null;
  changed_fields: string[] | null;
  changed_by: string | null;
  created_at: string;
}

export const MANIFEST_AUDIT_LABEL: Record<ManifestAuditAction, string> = {
  created: 'Ditambahkan',
  updated: 'Data diubah',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  reset_pending: 'Dikembalikan ke menunggu',
  deleted: 'Dihapus',
};

export const MANIFEST_FIELD_LABEL: Record<string, string> = {
  full_name: 'Nama lengkap',
  gender: 'Jenis kelamin',
  birth_date: 'Tanggal lahir',
  nik: 'NIK',
  passport_number: 'No. paspor',
  passport_expiry: 'Masa berlaku paspor',
  phone: 'No. HP',
  mahram_name: 'Mahram',
  room_type: 'Tipe kamar',
  room_number: 'Nomor kamar',
  bus_number: 'Nomor bus',
  notes: 'Catatan',
};

export const useManifestAuditLog = (departureId: string | undefined, limit = 100) => {
  return useQuery({
    queryKey: ['manifest-audit', departureId, limit],
    queryFn: async (): Promise<ManifestAuditEntry[]> => {
      if (!departureId) return [];
      const { data, error } = await (supabase as any)
        .from('manifest_audit_log')
        .select('*')
        .eq('departure_id', departureId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as ManifestAuditEntry[];
    },
    enabled: !!departureId,
  });
};

export const useManifestAuditCount = (departureId: string | undefined) => {
  return useQuery({
    queryKey: ['manifest-audit-count', departureId],
    queryFn: async (): Promise<number> => {
      if (!departureId) return 0;
      const { count, error } = await (supabase as any)
        .from('manifest_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('departure_id', departureId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!departureId,
  });
};

export const useAuditActorNames = (userIds: string[]) => {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  return useQuery({
    queryKey: ['audit-actor-names', unique.sort().join(',')],
    queryFn: async (): Promise<Record<string, string>> => {
      if (unique.length === 0) return {};
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', unique);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = p.full_name || p.email || 'Pengguna';
      });
      return map;
    },
    enabled: unique.length > 0,
  });
};
