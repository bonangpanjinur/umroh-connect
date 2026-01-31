// Path: supabase/functions/midtrans-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

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
      // Note: Sesuaikan logika update saldo di bawah dengan tabel yang Anda gunakan (package_credits vs agent_profiles)
      if (isSuccess && transaction.transaction_type === 'credit_topup') {
        const metadata = transaction.metadata as any;
        const creditsToAdd = metadata?.item_details?.[0]?.quantity || 0; // Atau ambil dari logic lain
        
        // Contoh update ke tabel package_credits (sesuai file frontend Anda)
        const { data: currentCredit } = await supabase
            .from('package_credits')
            .select('*')
            .eq('travel_id', transaction.agent_id) // Asumsi agent_id == travel_id di tabel ini
            .single();

        if (currentCredit) {
            await supabase.from('package_credits').update({
                credits_remaining: (currentCredit.credits_remaining || 0) + creditsToAdd
            }).eq('id', currentCredit.id);
            
            // Catat juga di credit_transactions agar muncul di riwayat dashboard
            await supabase.from('credit_transactions').insert({
                travel_id: transaction.agent_id,
                transaction_type: 'purchase',
                amount: creditsToAdd,
                price: transaction.amount,
                notes: `Topup Otomatis via Midtrans (${orderId})`
            });
        }
      }
    }

    return new Response(JSON.stringify({ status: "OK" }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});