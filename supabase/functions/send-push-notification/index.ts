import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  tag?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as PushPayload;
    const { userId, title, body, data, icon, badge, tag } = payload;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // VAPID keys from environment variables
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidEmail = Deno.env.get("VAPID_EMAIL") || "mailto:admin@arahumroh.id";

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    }

    // Get subscriptions for user(s)
    let query = supabase.from("push_subscriptions").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Web Push notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || "/pwa-192x192.png",
      badge: badge || "/pwa-192x192.png",
      tag: tag || `notification-${Date.now()}`,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: data?.url || "/",
      },
    });

    let successCount = 0;
    let failedCount = 0;

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          // Log to database first (legacy behavior kept for history)
          await supabase
            .from("payment_notification_logs")
            .insert({
              user_id: sub.user_id,
              notification_type: data?.type || "push",
              title,
              body,
              booking_id: data?.bookingId || null,
              payment_schedule_id: data?.scheduleId || null,
            });

          // Send real push notification if VAPID keys are present
          if (vapidPublicKey && vapidPrivateKey) {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };

            await webpush.sendNotification(pushSubscription, notificationPayload);
            return { success: true };
          }
          
          return { success: true, note: "VAPID keys missing, only logged to DB" };
        } catch (e: unknown) {
          console.error(`Error sending to endpoint ${sub.endpoint}:`, e);
          
          // If subscription is expired or invalid, remove it
          const err = e as { statusCode?: number; message?: string };
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          
          return { success: false, error: err.message || 'Unknown error' };
        }
      })
    );

    successCount = results.filter(r => r.success).length;
    failedCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        message: `Processed ${results.length} subscriptions. ${successCount} succeeded, ${failedCount} failed.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
