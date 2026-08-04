import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * True when the caller proves it is an internal/scheduled caller:
 * either it presents the shared cron secret, or it authenticates with the
 * service role key (used when one edge function calls another).
 */
export const isInternalCaller = (req: Request): boolean => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');
  if (cronSecret && providedSecret && providedSecret === cronSecret) return true;

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  return !!serviceKey && !!token && token === serviceKey;
};

/**
 * Resolves the authenticated user id from the request JWT, or null.
 */
export const getUserId = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
};
