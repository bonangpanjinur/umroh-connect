import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ManifestApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface JamaahManifestEntry {
  id: string;
  booking_id: string;
  departure_id: string | null;
  travel_id: string;
  full_name: string;
  gender: string;
  birth_date: string | null;
  nik: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  phone: string | null;
  mahram_name: string | null;
  room_type: string;
  room_number: string | null;
  bus_number: string | null;
  notes: string | null;
  approval_status: ManifestApprovalStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  updated_at: string;
}

export type EditableManifestFields = Pick<
  JamaahManifestEntry,
  'full_name' | 'gender' | 'birth_date' | 'nik' | 'passport_number' | 'passport_expiry' | 'phone' | 'mahram_name'
>;

export const REQUIRED_MANIFEST_FIELDS: { key: keyof EditableManifestFields; label: string }[] = [
  { key: 'full_name', label: 'Nama sesuai paspor' },
  { key: 'gender', label: 'Jenis kelamin' },
  { key: 'birth_date', label: 'Tanggal lahir' },
  { key: 'nik', label: 'NIK' },
  { key: 'passport_number', label: 'Nomor paspor' },
  { key: 'passport_expiry', label: 'Masa berlaku paspor' },
  { key: 'phone', label: 'Nomor telepon' },
];

export const useMyManifest = (bookingId?: string) => {
  return useQuery({
    queryKey: ['jamaah-manifest', bookingId],
    queryFn: async (): Promise<JamaahManifestEntry[]> => {
      if (!bookingId) return [];
      const { data, error } = await (supabase as any)
        .from('manifest_pilgrims')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as JamaahManifestEntry[];
    },
    enabled: !!bookingId,
  });
};

export const useUpdateMyManifest = (bookingId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
      resetRejection,
    }: {
      id: string;
      values: Partial<EditableManifestFields>;
      resetRejection?: boolean;
    }) => {
      const payload: Record<string, unknown> = { ...values };
      if (resetRejection) payload.approval_status = 'pending';

      const { error } = await (supabase as any)
        .from('manifest_pilgrims')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jamaah-manifest', bookingId] });
      toast({ title: 'Data tersimpan', description: 'Data keberangkatan Anda telah diperbarui.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal menyimpan',
        description: error?.message || 'Terjadi kesalahan saat menyimpan data.',
        variant: 'destructive',
      });
    },
  });
};

export const getManifestCompletion = (entry: JamaahManifestEntry) => {
  const missing = REQUIRED_MANIFEST_FIELDS.filter(
    (f) => !entry[f.key] || String(entry[f.key]).trim() === ''
  );
  return {
    missing,
    isComplete: missing.length === 0,
    percent: Math.round(
      ((REQUIRED_MANIFEST_FIELDS.length - missing.length) / REQUIRED_MANIFEST_FIELDS.length) * 100
    ),
  };
};
