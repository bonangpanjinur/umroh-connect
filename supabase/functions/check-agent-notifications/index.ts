import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  travel_id: string;
  notification_type: string;
  title: string;
  body: string;
  reference_id?: string;
  reference_type?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting agent notification check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notifications: NotificationPayload[] = [];

    // 1. Check for new inquiries (created in last hour, no notification sent yet)
    console.log('Checking for new inquiries...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: newInquiries, error: inquiriesError } = await supabase
      .from('package_inquiries')
      .select('id, travel_id, full_name, package_id')
      .gte('created_at', oneHourAgo)
      .eq('status', 'pending');

    if (inquiriesError) {
      console.error('Error fetching inquiries:', inquiriesError);
    } else if (newInquiries && newInquiries.length > 0) {
      console.log(`Found ${newInquiries.length} new inquiries`);
      
      for (const inquiry of newInquiries) {
        // Check if notification already exists
        const { data: existingNotif } = await supabase
          .from('agent_notifications')
          .select('id')
          .eq('reference_id', inquiry.id)
          .eq('notification_type', 'new_inquiry')
          .single();

        if (!existingNotif) {
          notifications.push({
            travel_id: inquiry.travel_id,
            notification_type: 'new_inquiry',
            title: 'Inquiry Baru',
            body: `${inquiry.full_name} tertarik dengan paket Anda`,
            reference_id: inquiry.id,
            reference_type: 'inquiry'
          });
        }
      }
    }

    // 2. Check for overdue payments
    console.log('Checking for overdue payments...');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overduePayments, error: paymentsError } = await supabase
      .from('payment_schedules')
      .select(`
        id,
        booking_id,
        amount,
        due_date,
        booking:bookings(travel_id, booking_code, contact_name)
      `)
      .eq('is_paid', false)
      .lt('due_date', today);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    } else if (overduePayments && overduePayments.length > 0) {
      console.log(`Found ${overduePayments.length} overdue payments`);
      
      for (const payment of overduePayments) {
        const booking = payment.booking as any;
        if (!booking) continue;

        // Check if notification already exists for this payment (avoid duplicates)
        const { data: existingNotif } = await supabase
          .from('agent_notifications')
          .select('id')
          .eq('reference_id', payment.id)
          .eq('notification_type', 'overdue_payment')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Only check last 24h
          .single();

        if (!existingNotif) {
          const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24));
          
          notifications.push({
            travel_id: booking.travel_id,
            notification_type: 'overdue_payment',
            title: 'Pembayaran Terlambat',
            body: `Booking ${booking.booking_code} (${booking.contact_name}) telat ${daysOverdue} hari`,
            reference_id: payment.booking_id,
            reference_type: 'booking'
          });
        }
      }
    }

    // 3. Check for new bookings (last hour)
    console.log('Checking for new bookings...');
    const { data: newBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, travel_id, booking_code, contact_name')
      .gte('created_at', oneHourAgo);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    } else if (newBookings && newBookings.length > 0) {
      console.log(`Found ${newBookings.length} new bookings`);
      
      for (const booking of newBookings) {
        const { data: existingNotif } = await supabase
          .from('agent_notifications')
          .select('id')
          .eq('reference_id', booking.id)
          .eq('notification_type', 'new_booking')
          .single();

        if (!existingNotif) {
          notifications.push({
            travel_id: booking.travel_id,
            notification_type: 'new_booking',
            title: 'Booking Baru! 🎉',
            body: `${booking.contact_name} melakukan booking (${booking.booking_code})`,
            reference_id: booking.id,
            reference_type: 'booking'
          });
        }
      }
    }

    // 4. Check for new haji registrations
    console.log('Checking for new haji registrations...');
    const { data: newHajiRegs, error: hajiError } = await supabase
      .from('haji_registrations')
      .select('id, travel_id, full_name')
      .gte('created_at', oneHourAgo)
      .eq('status', 'pending');

    if (hajiError) {
      console.error('Error fetching haji registrations:', hajiError);
    } else if (newHajiRegs && newHajiRegs.length > 0) {
      console.log(`Found ${newHajiRegs.length} new haji registrations`);
      
      for (const reg of newHajiRegs) {
        const { data: existingNotif } = await supabase
          .from('agent_notifications')
          .select('id')
          .eq('reference_id', reg.id)
          .eq('notification_type', 'new_haji_registration')
          .single();

        if (!existingNotif) {
          notifications.push({
            travel_id: reg.travel_id,
            notification_type: 'new_haji_registration',
            title: 'Pendaftaran Haji Baru',
            body: `${reg.full_name} mendaftar program haji`,
            reference_id: reg.id,
            reference_type: 'haji'
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      console.log(`Inserting ${notifications.length} notifications...`);
      
      const { error: insertError } = await supabase
        .from('agent_notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }
      
      console.log('Notifications inserted successfully');
    } else {
      console.log('No new notifications to create');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${notifications.length} notifications`,
        details: {
          inquiries: notifications.filter(n => n.notification_type === 'new_inquiry').length,
          overdue: notifications.filter(n => n.notification_type === 'overdue_payment').length,
          bookings: notifications.filter(n => n.notification_type === 'new_booking').length,
          haji: notifications.filter(n => n.notification_type === 'new_haji_registration').length,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-agent-notifications:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});