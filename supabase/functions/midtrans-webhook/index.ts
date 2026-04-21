// Path: supabase/functions/midtrans-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const notification = await req.json();
    console.log("Midtrans Notification:", JSON.stringify(notification));

    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const receivedSignature = notification.signature_key;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // 0. VALIDASI SIGNATURE MIDTRANS (SHA512)
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
    }
    if (!orderId || !statusCode || !grossAmount || !receivedSignature) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const signaturePayload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const expectedSignature = await sha512Hex(signaturePayload);

    if (expectedSignature !== receivedSignature) {
      console.error("Invalid Midtrans signature for order:", orderId);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    // 1. Ambil transaksi
    const { data: transaction, error: fetchError } = await supabase
      .from("agent_transactions")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (fetchError || !transaction) return new Response("Transaction not found", { status: 404 });
    if (transaction.status === 'paid') return new Response("OK", { status: 200 });

    let newStatus = transaction.status;
    let isSuccess = false;

    // 2. Cek status Midtrans
    if (transactionStatus == 'capture') {
      if (fraudStatus == 'accept') { newStatus = 'paid'; isSuccess = true; }
    } else if (transactionStatus == 'settlement') {
      newStatus = 'paid'; isSuccess = true;
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'failed';
    }

    // 3. Update Status
    if (newStatus !== transaction.status) {
      await supabase.from("agent_transactions")
        .update({ status: newStatus, payment_method: notification.payment_type, updated_at: new Date().toISOString() })
        .eq("id", transaction.id);
      
      // 4. Tambah Kredit (Jika Sukses)
      if (isSuccess && transaction.transaction_type === 'credit_topup') {
        const metadata = transaction.metadata as any;
        const creditsToAdd = metadata?.item_details?.[0]?.quantity || 0;
        
        const { data: currentCredit } = await supabase
            .from('package_credits')
            .select('*')
            .eq('travel_id', transaction.agent_id)
            .single();

        if (currentCredit) {
            await supabase.from('package_credits').update({
                credits_remaining: (currentCredit.credits_remaining || 0) + creditsToAdd
            }).eq('id', currentCredit.id);
            
            await supabase.from('credit_transactions').insert({
                travel_id: transaction.agent_id,
                transaction_type: 'purchase',
                amount: creditsToAdd,
                price: transaction.amount,
                notes: `Topup Otomatis via Midtrans (${orderId})`
            });
        }
      }

      // 5. Aktivasi Fitur Website Pro (Jika Sukses)
      if (isSuccess && transaction.transaction_type === 'website_pro') {
        await supabase.from('agent_website_settings')
          .update({
            is_pro_active: true,
            is_custom_url_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.agent_id);
      }
    }

    return new Response(JSON.stringify({ status: "OK" }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Webhook error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
