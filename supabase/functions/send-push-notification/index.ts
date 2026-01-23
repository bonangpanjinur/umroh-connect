import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    let failedEndpoints: string[] = [];

    // Note: In production, you would use web-push library with VAPID keys
    // For now, we'll store notifications in the database for the PWA to poll
    for (const subscription of subscriptions) {
      try {
        // Store notification in payment_notification_logs for the user to see
        const { error: logError } = await supabase
          .from("payment_notification_logs")
          .insert({
            user_id: subscription.user_id,
            notification_type: data?.type || "push",
            title,
            body,
            booking_id: data?.bookingId || null,
            payment_schedule_id: data?.scheduleId || null,
          });

        if (!logError) {
          successCount++;
        } else {
          console.error("Error logging notification:", logError);
        }
      } catch (e) {
        console.error("Error processing subscription:", e);
        failedEndpoints.push(subscription.endpoint);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedEndpoints.length,
        message: `Sent ${successCount} notifications`,
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
