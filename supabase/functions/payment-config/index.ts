import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

type PublicPaymentProvider = 'manual' | 'midtrans' | 'xendit';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: paymentSetting, error: paymentError }, { data: qrisSetting, error: qrisError }] =
      await Promise.all([
        supabase.from('platform_settings').select('value').eq('key', 'payment_gateway').maybeSingle(),
        supabase.from('platform_settings').select('value').eq('key', 'qris_image_url').maybeSingle(),
      ]);

    if (paymentError) {
      console.error('[payment-config] failed to fetch payment_gateway:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to load payment config' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (qrisError) {
      console.warn('[payment-config] failed to fetch qris_image_url:', qrisError);
    }

    const cfg = (paymentSetting?.value ?? {}) as any;

    const provider = (cfg.provider ?? 'manual') as PublicPaymentProvider;
    const isTestMode = cfg.isTestMode ?? true;
    const apiKey = cfg.apiKey ?? undefined; // publishable (client key)
    const autoVerify = cfg.autoVerify ?? false;
    const paymentMethods = Array.isArray(cfg.paymentMethods) ? cfg.paymentMethods : [];

    const qrisValue = (qrisSetting?.value ?? '') as any;
    const qrisImageUrl =
      typeof qrisValue === 'string'
        ? qrisValue
        : (qrisValue && typeof qrisValue === 'object' ? (qrisValue.url ?? '') : '');

    console.log('[payment-config] served config', {
      provider,
      isTestMode,
      paymentMethodsCount: paymentMethods.length,
      qrisImageUrl: qrisImageUrl ? 'set' : 'empty',
    });

    return new Response(
      JSON.stringify({
        provider,
        isTestMode,
        apiKey,
        autoVerify,
        paymentMethods,
        qrisImageUrl,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[payment-config] error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
