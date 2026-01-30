import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  item_name: string;
  payment_type: 'premium_subscription' | 'credit_purchase';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get payment gateway settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('key', 'payment_gateway')
      .single();

    if (settingsError || !settings) {
      console.error('Failed to get payment settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = settings.value as any;
    const provider = config.provider;

    if (provider === 'manual') {
      return new Response(
        JSON.stringify({ 
          provider: 'manual',
          message: 'Manual payment - show bank transfer details' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaymentRequest = await req.json();
    const { amount, order_id, customer_name, customer_email, customer_phone, item_name, payment_type } = body;

    console.log('Creating payment:', { provider, amount, order_id, customer_name, item_name });

    if (provider === 'midtrans') {
      const serverKey = config.serverKey;
      const isTestMode = config.isTestMode;
      
      if (!serverKey) {
        return new Response(
          JSON.stringify({ error: 'Midtrans server key not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const midtransUrl = isTestMode 
        ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
        : 'https://app.midtrans.com/snap/v1/transactions';

      const authString = btoa(serverKey + ':');

      const midtransPayload = {
        transaction_details: {
          order_id: order_id,
          gross_amount: amount
        },
        customer_details: {
          first_name: customer_name,
          email: customer_email,
          phone: customer_phone || ''
        },
        item_details: [{
          id: payment_type,
          price: amount,
          quantity: 1,
          name: item_name
        }],
        callbacks: {
          finish: `${req.headers.get('origin')}/payment/finish`,
          error: `${req.headers.get('origin')}/payment/error`,
          pending: `${req.headers.get('origin')}/payment/pending`
        }
      };

      console.log('Calling Midtrans API:', midtransUrl);

      const midtransResponse = await fetch(midtransUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify(midtransPayload)
      });

      const midtransResult = await midtransResponse.json();
      console.log('Midtrans response:', midtransResult);

      if (!midtransResponse.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'Midtrans error', 
            details: midtransResult 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          provider: 'midtrans',
          token: midtransResult.token,
          redirect_url: midtransResult.redirect_url,
          order_id: order_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (provider === 'xendit') {
      const secretKey = config.serverKey;
      const isTestMode = config.isTestMode;
      
      if (!secretKey) {
        return new Response(
          JSON.stringify({ error: 'Xendit secret key not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const xenditUrl = 'https://api.xendit.co/v2/invoices';
      const authString = btoa(secretKey + ':');

      const xenditPayload = {
        external_id: order_id,
        amount: amount,
        payer_email: customer_email,
        description: item_name,
        currency: 'IDR',
        customer: {
          given_names: customer_name,
          email: customer_email,
          mobile_number: customer_phone
        },
        success_redirect_url: `${req.headers.get('origin')}/payment/success`,
        failure_redirect_url: `${req.headers.get('origin')}/payment/failed`
      };

      console.log('Calling Xendit API');

      const xenditResponse = await fetch(xenditUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify(xenditPayload)
      });

      const xenditResult = await xenditResponse.json();
      console.log('Xendit response:', xenditResult);

      if (!xenditResponse.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'Xendit error', 
            details: xenditResult 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          provider: 'xendit',
          invoice_id: xenditResult.id,
          invoice_url: xenditResult.invoice_url,
          order_id: order_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown payment provider' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});