import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

// Types
export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
export type PaymentType = 'dp' | 'installment' | 'final';

export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  departure_id: string | null;
  travel_id: string;
  booking_code: string;
  status: BookingStatus;
  number_of_pilgrims: number;
  total_price: number;
  paid_amount: number;
  remaining_amount: number;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  notes: string | null;
  agent_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  package?: {
    name: string;
    package_type: string;
  };
  travel?: {
    name: string;
    whatsapp: string | null;
  };
  departure?: {
    departure_date: string;
    return_date: string;
  };
  payment_schedules?: PaymentSchedule[];
}

export interface PaymentSchedule {
  id: string;
  booking_id: string;
  payment_type: PaymentType;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  paid_amount: number;
  payment_proof_url: string | null;
  reminder_sent_h7: boolean;
  reminder_sent_h3: boolean;
  reminder_sent_h1: boolean;
  reminder_sent_overdue: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentNotificationLog {
  id: string;
  user_id: string;
  booking_id: string | null;
  payment_schedule_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  sent_at: string;
  is_read: boolean;
  read_at: string | null;
}

// Fetch user's bookings
export const useUserBookings = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['bookings', 'user', user?.id],
    queryFn: async (): Promise<Booking[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          package:packages(name, package_type),
          travel:travels(name, whatsapp),
          departure:departures(departure_date, return_date),
          payment_schedules(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Booking[];
    },
    enabled: !!user?.id,
  });
};

// Fetch agent's bookings (for their travel)
export const useAgentBookings = (travelId?: string) => {
  return useQuery({
    queryKey: ['bookings', 'agent', travelId],
    queryFn: async (): Promise<Booking[]> => {
      if (!travelId) return [];
      
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          package:packages(name, package_type),
          departure:departures(departure_date, return_date),
          payment_schedules(*)
        `)
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Booking[];
    },
    enabled: !!travelId,
  });
};

// Fetch single booking with details
export const useBookingDetails = (bookingId?: string) => {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async (): Promise<Booking | null> => {
      if (!bookingId) return null;
      
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          package:packages(name, package_type),
          travel:travels(name, whatsapp),
          departure:departures(departure_date, return_date),
          payment_schedules(*)
        `)
        .eq('id', bookingId)
        .single();
      
      if (error) throw error;
      return data as unknown as Booking;
    },
    enabled: !!bookingId,
  });
};

// Create booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      packageId: string;
      departureId?: string;
      travelId: string;
      numberOfPilgrims: number;
      totalPrice: number;
      contactName: string;
      contactPhone: string;
      contactEmail?: string;
      notes?: string;
      paymentSchedules?: {
        paymentType: PaymentType;
        amount: number;
        dueDate: string;
      }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Create booking
      const { data: booking, error: bookingError } = await (supabase as any)
        .from('bookings')
        .insert({
          user_id: user.id,
          package_id: data.packageId,
          departure_id: data.departureId || null,
          travel_id: data.travelId,
          number_of_pilgrims: data.numberOfPilgrims,
          total_price: data.totalPrice,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail || null,
          notes: data.notes || null,
        })
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      // Create payment schedules if provided
      if (data.paymentSchedules && data.paymentSchedules.length > 0) {
        const schedulesToInsert = data.paymentSchedules.map(schedule => ({
          booking_id: booking.id,
          payment_type: schedule.paymentType,
          amount: schedule.amount,
          due_date: schedule.dueDate,
        }));
        
        const { error: scheduleError } = await (supabase as any)
          .from('payment_schedules')
          .insert(schedulesToInsert);
        
        if (scheduleError) throw scheduleError;
      }
      
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Berhasil',
        description: 'Booking Anda telah berhasil dibuat',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membuat Booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update booking status (for agents)
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      status,
      agentNotes 
    }: { 
      bookingId: string; 
      status: BookingStatus;
      agentNotes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ 
          status,
          agent_notes: agentNotes,
        })
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Status Diperbarui',
        description: 'Status booking berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Update',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Record payment (for agents)
export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      scheduleId, 
      paidAmount,
      paymentProofUrl,
      notes
    }: { 
      scheduleId: string; 
      paidAmount: number;
      paymentProofUrl?: string;
      notes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('payment_schedules')
        .update({ 
          is_paid: true,
          paid_at: new Date().toISOString(),
          paid_amount: paidAmount,
          payment_proof_url: paymentProofUrl || null,
          notes: notes || null,
        })
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      toast({
        title: 'Pembayaran Tercatat',
        description: 'Pembayaran berhasil dicatat',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Mencatat',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Fetch user's payment notifications
export const usePaymentNotifications = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['payment-notifications', user?.id],
    queryFn: async (): Promise<PaymentNotificationLog[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('payment_notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as PaymentNotificationLog[];
    },
    enabled: !!user?.id,
  });
};

// Mark notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any)
        .from('payment_notification_logs')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-notifications'] });
    },
  });
};

// Get upcoming payments (for user dashboard)
export const useUpcomingPayments = () => {
  const { data: bookings } = useUserBookings();
  
  const upcomingPayments = (bookings || [])
    .flatMap(booking => 
      (booking.payment_schedules || [])
        .filter(schedule => !schedule.is_paid)
        .map(schedule => ({
          ...schedule,
          bookingCode: booking.booking_code,
          packageName: booking.package?.name || 'Paket',
          travelName: booking.travel?.name || 'Travel',
        }))
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  
  return upcomingPayments;
};

// Get payment stats (for agent dashboard)
export const usePaymentStats = (travelId?: string) => {
  const { data: bookings } = useAgentBookings(travelId);
  
  const stats = {
    totalBookings: (bookings || []).length,
    pendingPayments: 0,
    overduePayments: 0,
    totalPaid: 0,
    totalRemaining: 0,
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  (bookings || []).forEach(booking => {
    stats.totalPaid += booking.paid_amount;
    stats.totalRemaining += booking.remaining_amount;
    
    (booking.payment_schedules || []).forEach(schedule => {
      if (!schedule.is_paid) {
        const dueDate = new Date(schedule.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          stats.overduePayments++;
        } else {
          stats.pendingPayments++;
        }
      }
    });
  });
  
  return stats;
};
