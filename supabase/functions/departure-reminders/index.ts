import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Booking {
  id: string;
  user_id: string;
  booking_code: string;
  contact_name: string;
  departure_reminder_h30: boolean;
  departure_reminder_h14: boolean;
  departure_reminder_h7: boolean;
  departure_reminder_h3: boolean;
  departure_reminder_h1: boolean;
  departure_reminder_h0: boolean;
  package: { name: string } | null;
  travel: { name: string } | null;
  departure: { departure_date: string; return_date: string } | null;
}

interface ReminderTemplate {
  type: string;
  field: keyof Pick<Booking, 'departure_reminder_h30' | 'departure_reminder_h14' | 'departure_reminder_h7' | 'departure_reminder_h3' | 'departure_reminder_h1' | 'departure_reminder_h0'>;
  days: number;
  title: string;
  body: (packageName: string, date: string) => string;
}

const reminderTemplates: ReminderTemplate[] = [
  {
    type: 'h30',
    field: 'departure_reminder_h30',
    days: 30,
    title: '30 Hari Menuju Keberangkatan 🕌',
    body: (pkg, date) => `${pkg}: Waktunya mempersiapkan dokumen dan perlengkapan! Keberangkatan: ${date}`,
  },
  {
    type: 'h14',
    field: 'departure_reminder_h14',
    days: 14,
    title: '2 Minggu Lagi Menuju Tanah Suci! ✈️',
    body: (pkg, date) => `${pkg}: Pastikan paspor, visa, dan tiket sudah siap. Keberangkatan: ${date}`,
  },
  {
    type: 'h7',
    field: 'departure_reminder_h7',
    days: 7,
    title: 'Seminggu Menuju Tanah Suci 🕋',
    body: (pkg, date) => `${pkg}: Periksa kembali checklist perlengkapan Anda. Keberangkatan: ${date}`,
  },
  {
    type: 'h3',
    field: 'departure_reminder_h3',
    days: 3,
    title: '3 Hari Lagi! 🌙',
    body: (pkg, date) => `${pkg}: Siapkan pakaian ihram dan perlengkapan sholat. Keberangkatan: ${date}`,
  },
  {
    type: 'h1',
    field: 'departure_reminder_h1',
    days: 1,
    title: 'Besok Berangkat! 🤲',
    body: (pkg, date) => `${pkg}: Istirahat yang cukup, baca doa safar, dan pastikan semua sudah siap. Keberangkatan: ${date}`,
  },
  {
    type: 'h0',
    field: 'departure_reminder_h0',
    days: 0,
    title: 'Hari Keberangkatan! ✨',
    body: (pkg, _date) => `${pkg}: Bismillah, semoga perjalanan umroh Anda berkah dan lancar. Selamat menunaikan ibadah!`,
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch confirmed/paid bookings with departure info
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_code,
        contact_name,
        departure_reminder_h30,
        departure_reminder_h14,
        departure_reminder_h7,
        departure_reminder_h3,
        departure_reminder_h1,
        departure_reminder_h0,
        package:packages(name),
        travel:travels(name),
        departure:departures(departure_date, return_date)
      `)
      .in('status', ['confirmed', 'paid'])
      .not('departure_id', 'is', null);
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      throw bookingsError;
    }
    
    console.log(`Processing ${bookings?.length || 0} bookings for departure reminders`);
    
    const notificationsSent: { type: string; bookingCode: string; daysUntil: number }[] = [];
    
    for (const booking of (bookings || []) as unknown as Booking[]) {
      if (!booking.departure?.departure_date) continue;
      
      const departureDate = new Date(booking.departure.departure_date);
      departureDate.setHours(0, 0, 0, 0);
      
      const daysUntilDeparture = Math.ceil(
        (departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Skip if departure is in the past
      if (daysUntilDeparture < 0) continue;
      
      const packageName = booking.package?.name || 'Paket Umroh';
      const formattedDate = departureDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      
      // Check each reminder milestone
      for (const template of reminderTemplates) {
        // Check if we should send this reminder
        const shouldSend = 
          daysUntilDeparture === template.days && 
          !booking[template.field];
        
        if (shouldSend) {
          console.log(`Sending ${template.type} reminder for booking ${booking.booking_code}`);
          
          // Insert notification log
          const { error: insertError } = await supabase
            .from('departure_notification_logs')
            .insert({
              user_id: booking.user_id,
              booking_id: booking.id,
              notification_type: template.type,
              title: template.title,
              body: template.body(packageName, formattedDate),
            });
          
          if (insertError) {
            console.error(`Error inserting ${template.type} notification:`, insertError);
            continue;
          }
          
          // Update booking reminder flag
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ [template.field]: true })
            .eq('id', booking.id);
          
          if (updateError) {
            console.error(`Error updating booking ${template.field}:`, updateError);
            continue;
          }
          
          notificationsSent.push({
            type: template.type,
            bookingCode: booking.booking_code,
            daysUntil: daysUntilDeparture,
          });
          
          // Optional: Trigger push notification via existing function
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: booking.user_id,
                title: template.title,
                body: template.body(packageName, formattedDate),
                data: {
                  type: 'departure_reminder',
                  bookingId: booking.id,
                  daysUntil: daysUntilDeparture,
                },
              },
            });
          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
            // Continue even if push fails - notification is logged
          }
        }
      }
    }
    
    console.log(`Sent ${notificationsSent.length} departure reminders`);
    
    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notificationsSent.length,
        notifications: notificationsSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing departure reminders:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
