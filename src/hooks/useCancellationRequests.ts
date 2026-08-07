import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    queryKey: ['cancellation-requests', 'user', user?.id, bookingId],
    queryFn: async (): Promise<CancellationRequest[]> => {
      if (!user?.id) return [];
      let query = (supabase as any)
        .from('booking_cancellation_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (bookingId) query = query.eq('booking_id', bookingId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CancellationRequest[];
    },
    enabled: !!user?.id,
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
      const { error } = await (supabase as any)
        .from('booking_cancellation_requests')
        .insert({ ...payload, user_id: user.id, status: 'pending' });
      if (error) throw error;
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
  return useQuery({
    queryKey: ['cancellation-requests', 'travel', travelId],
    queryFn: async (): Promise<CancellationRequest[]> => {
      if (!travelId) return [];
      const { data, error } = await (supabase as any)
        .from('booking_cancellation_requests')
        .select('*, booking:bookings(booking_code, contact_name, total_price, paid_amount, status)')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CancellationRequest[];
    },
    enabled: !!travelId,
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
      const { error } = await (supabase as any)
        .from('booking_cancellation_requests')
        .update({ status, travel_note: travel_note || null })
        .eq('id', id);
      if (error) throw error;
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
