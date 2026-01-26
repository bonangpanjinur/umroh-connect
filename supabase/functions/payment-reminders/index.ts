import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentSchedule {
  id: string;
  booking_id: string;
  payment_type: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  reminder_sent_h7: boolean;
  reminder_sent_h3: boolean;
  reminder_sent_h1: boolean;
  reminder_sent_overdue: boolean;
}

interface Booking {
  id: string;
  user_id: string;
  booking_code: string;
  contact_name: string;
  package: { name: string } | null;
  travel: { name: string; whatsapp: string | null } | null;
}

interface NotificationToSend {
  userId: string;
  bookingId: string;
  scheduleId: string;
  type: 'h7' | 'h3' | 'h1' | 'overdue';
  title: string;
  body: string;
  bookingCode: string;
  packageName: string;
  amount: number;
  dueDate: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const h1Date = new Date(today);
    h1Date.setDate(h1Date.getDate() + 1);
    
    const h3Date = new Date(today);
    h3Date.setDate(h3Date.getDate() + 3);
    
    const h7Date = new Date(today);
    h7Date.setDate(h7Date.getDate() + 7);
    
    // Fetch unpaid payment schedules with booking info
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select(`
        *,
        booking:bookings!inner(
          id,
          user_id,
          booking_code,
          contact_name,
          package:packages(name),
          travel:travels(name, whatsapp)
        )
      `)
      .eq('is_paid', false);
    
    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }
    
    const notificationsToSend: NotificationToSend[] = [];
    const updatesToMake: { id: string; field: string }[] = [];
    
    for (const schedule of schedules || []) {
      const dueDate = new Date(schedule.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const booking = schedule.booking as Booking;
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const packageName = booking.package?.name || 'Paket Umroh';
      const formatAmount = (amount: number) => 
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      
      // Check for H-7 reminder
      if (diffDays <= 7 && diffDays > 3 && !schedule.reminder_sent_h7) {
        notificationsToSend.push({
          userId: booking.user_id,
          bookingId: booking.id,
          scheduleId: schedule.id,
          type: 'h7',
          title: '📅 Pengingat Pembayaran H-7',
          body: `${packageName}: Pembayaran ${formatAmount(schedule.amount)} jatuh tempo dalam ${diffDays} hari (${schedule.due_date})`,
          bookingCode: booking.booking_code,
          packageName,
          amount: schedule.amount,
          dueDate: schedule.due_date,
        });
        updatesToMake.push({ id: schedule.id, field: 'reminder_sent_h7' });
      }
      
      // Check for H-3 reminder
      if (diffDays <= 3 && diffDays > 1 && !schedule.reminder_sent_h3) {
        notificationsToSend.push({
          userId: booking.user_id,
          bookingId: booking.id,
          scheduleId: schedule.id,
          type: 'h3',
          title: '⚠️ Pembayaran 3 Hari Lagi!',
          body: `${packageName}: Segera lunasi ${formatAmount(schedule.amount)} sebelum ${schedule.due_date}`,
          bookingCode: booking.booking_code,
          packageName,
          amount: schedule.amount,
          dueDate: schedule.due_date,
        });
        updatesToMake.push({ id: schedule.id, field: 'reminder_sent_h3' });
      }
      
      // Check for H-1 reminder
      if (diffDays === 1 && !schedule.reminder_sent_h1) {
        notificationsToSend.push({
          userId: booking.user_id,
          bookingId: booking.id,
          scheduleId: schedule.id,
          type: 'h1',
          title: '🚨 Pembayaran Besok!',
          body: `${packageName}: Batas pembayaran ${formatAmount(schedule.amount)} adalah BESOK!`,
          bookingCode: booking.booking_code,
          packageName,
          amount: schedule.amount,
          dueDate: schedule.due_date,
        });
        updatesToMake.push({ id: schedule.id, field: 'reminder_sent_h1' });
      }
      
      // Check for overdue
      if (diffDays < 0 && !schedule.reminder_sent_overdue) {
        const overdueDays = Math.abs(diffDays);
        notificationsToSend.push({
          userId: booking.user_id,
          bookingId: booking.id,
          scheduleId: schedule.id,
          type: 'overdue',
          title: '❌ Pembayaran Terlambat!',
          body: `${packageName}: Pembayaran ${formatAmount(schedule.amount)} sudah terlambat ${overdueDays} hari. Segera hubungi travel Anda.`,
          bookingCode: booking.booking_code,
          packageName,
          amount: schedule.amount,
          dueDate: schedule.due_date,
        });
        updatesToMake.push({ id: schedule.id, field: 'reminder_sent_overdue' });
      }
    }
    
    console.log(`Found ${notificationsToSend.length} notifications to send`);
    
    // Insert notification logs and update schedules
    for (const notification of notificationsToSend) {
      // Insert notification log
      const { error: insertError } = await supabase
        .from('payment_notification_logs')
        .insert({
          user_id: notification.userId,
          booking_id: notification.bookingId,
          payment_schedule_id: notification.scheduleId,
          notification_type: notification.type,
          title: notification.title,
          body: notification.body,
        });
      
      if (insertError) {
        console.error('Error inserting notification log:', insertError);
      }
    }
    
    // Update reminder flags
    for (const update of updatesToMake) {
      const { error: updateError } = await supabase
        .from('payment_schedules')
        .update({ [update.field]: true })
        .eq('id', update.id);
      
      if (updateError) {
        console.error('Error updating schedule:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notificationsToSend.length,
        notifications: notificationsToSend.map(n => ({
          type: n.type,
          bookingCode: n.bookingCode,
          amount: n.amount,
          dueDate: n.dueDate,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing payment reminders:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
