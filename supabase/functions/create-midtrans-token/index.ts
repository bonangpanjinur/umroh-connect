// Path: supabase/functions/create-midtrans-token/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { amount, itemDetails, transactionType } = await req.json();
    const orderId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Konfigurasi Midtrans
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";
    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
    const midtransUrl = isProduction 
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email: user.email,
      },
      item_details: itemDetails,
      credit_card: { secure: true },
    };

    const midtransResponse = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${serverKey}:`)}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      throw new Error(`Midtrans Error: ${JSON.stringify(midtransData)}`);
    }

    // Simpan ke database
    const { error: dbError } = await supabase
      .from("agent_transactions")
      .insert({
        agent_id: user.id,
        order_id: orderId,
        amount: amount,
        transaction_type: transactionType,
        status: "pending",
        snap_token: midtransData.token,
        metadata: { item_details: itemDetails },
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ token: midtransData.token, orderId: orderId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});