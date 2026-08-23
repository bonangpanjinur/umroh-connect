import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantScope, tenantScopeKey } from '@/hooks/useTenantScope';
import { coreApi } from '@/lib/coreApi';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export type CancellationStatus = 'pending' | 'approved' | 'rejected';

export interface CancellationRequest {
  id: string;
  booking_id: string;
  travel_id: string;
  user_id: string;
  reason: string;
  penalty_percent: number;
  refund_estimate: number;
  status: CancellationStatus;
  travel_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  booking?: {
    booking_code: string;
    contact_name: string;
    total_price: number;
    paid_amount: number;
    status: string;
  } | null;
}

export const useMyCancellationRequests = (bookingId?: string) => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['cancellation-requests', 'core', 'user', user?.id ?? null, bookingId ?? null],
    queryFn: () => coreApi.listMyCancellationRequests(bookingId) as Promise<CancellationRequest[]>,
    enabled: Boolean(user?.id),
  });
};

export const useCreateCancellationRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (payload: {
      booking_id: string;
      travel_id: string;
      reason: string;
      penalty_percent: number;
      refund_estimate: number;
    }) => {
      if (!user?.id) throw new Error('Anda harus masuk terlebih dahulu.');
      await coreApi.createCancellationRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-requests'] });
      toast({
        title: 'Permintaan terkirim',
        description: 'Travel akan meninjau pengajuan pembatalan Anda.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal mengirim permintaan',
        description: error?.message?.includes('duplicate')
          ? 'Sudah ada pengajuan pembatalan yang sedang diproses.'
          : error?.message || 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    },
  });
};

export const useTravelCancellationRequests = (travelId?: string) => {
  const { data: scope } = useTenantScope();
  return useQuery({
    queryKey: ['cancellation-requests', 'core', 'management', tenantScopeKey(scope), travelId ?? null],
    queryFn: async (): Promise<CancellationRequest[]> => {
      if (!travelId) return [];
      return coreApi.listManagementCancellationRequests() as Promise<CancellationRequest[]>;
    },
    enabled: Boolean(travelId && scope?.tenant_id),
  });
};

export const useReviewCancellationRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      travel_note,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      travel_note?: string;
    }) => {
      await coreApi.reviewCancellationRequest(id, { status, travel_note: travel_note || null });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: variables.status === 'approved' ? 'Pembatalan disetujui' : 'Pembatalan ditolak',
        description:
          variables.status === 'approved'
            ? 'Booking telah dibatalkan.'
            : 'Jemaah akan melihat catatan penolakan Anda.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal memproses',
        description: error?.message || 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    },
  });
};
