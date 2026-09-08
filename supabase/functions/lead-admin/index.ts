import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getUserId, jsonResponse } from '../_shared/auth.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const fail = (code: string, message: string, status = 400) => jsonResponse({ error: { code, message, retryable: status >= 500 } }, status);

async function ensureAdmin(req: Request) {
  const userId = await getUserId(req);
  if (!userId) throw new Error('UNAUTHENTICATED');
  const { data, error } = await admin.from('user_roles').select('role').eq('user_id', userId).in('role', ['admin', 'super_admin']).limit(1);
  if (error) throw error;
  if (!data?.length) throw new Error('FORBIDDEN');
  return userId;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const userId = await ensureAdmin(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'metrics');
    if (action === 'metrics') {
      const count = async (table: string, status?: string) => {
        let query = admin.from(table).select('*', { count: 'exact', head: true });
        if (status) query = query.eq('status', status);
        const { count: total, error } = await query;
        if (error) throw error;
        return total || 0;
      };
      const [leadTotal, leadQueued, leadDelivered, leadAccepted, leadRejected, deliveryTotal, deliveryPending, deliveryClaimed, deliveryAccepted, deliveryRejected, deliveryDead, installationTotal, installationConnected, installationDegraded, installationDisabled, eventTotal, eventProcessed, eventFailed, eventIgnored] = await Promise.all([
        count('central_leads'), count('central_leads', 'queued'), count('central_leads', 'delivered'), count('central_leads', 'accepted'), count('central_leads', 'rejected'),
        count('central_lead_deliveries'), count('central_lead_deliveries', 'pending'), count('central_lead_deliveries', 'claimed'), count('central_lead_deliveries', 'accepted'), count('central_lead_deliveries', 'rejected'), count('central_lead_deliveries', 'dead_letter'),
        count('tenant_installations'), count('tenant_installations', 'connected'), count('tenant_installations', 'degraded'), count('tenant_installations', 'disabled'),
        count('tenant_sync_events'), count('tenant_sync_events', 'processed'), count('tenant_sync_events', 'failed'), count('tenant_sync_events', 'ignored'),
      ]);
      return jsonResponse({ data: {
        leads: { total: leadTotal, queued: leadQueued, delivered: leadDelivered, accepted: leadAccepted, rejected: leadRejected },
        deliveries: { total: deliveryTotal, pending: deliveryPending, claimed: deliveryClaimed, accepted: deliveryAccepted, rejected: deliveryRejected, dead_letter: deliveryDead },
        installations: { total: installationTotal, connected: installationConnected, degraded: installationDegraded, disabled: installationDisabled },
        sync_events: { total: eventTotal, processed: eventProcessed, failed: eventFailed, ignored: eventIgnored },
        generated_at: new Date().toISOString(),
      } });
    }
    if (action === 'list') {
      const limit = Math.min(100, Math.max(1, Number(body.limit || 50)));
      const { data, error } = await admin.from('central_leads').select('id,tenant_id,product_id,source_domain,full_name,phone,email,message,status,created_at,updated_at,central_lead_deliveries(id,installation_id,status,attempts,available_at,claimed_at,accepted_at,last_error,updated_at),tenant_registry(name,slug,custom_domain),central_catalog_products(name)').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return jsonResponse({ data: data || [] });
    }
    if (action === 'retry') {
      const deliveryId = String(body.delivery_id || '');
      if (!deliveryId) return fail('DELIVERY_REQUIRED', 'delivery_id wajib diisi.');
      const { data, error } = await admin.from('central_lead_deliveries').update({ status: 'pending', available_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq('id', deliveryId).in('status', ['rejected', 'dead_letter']).select('id,status').single();
      if (error) return fail('RETRY_NOT_ALLOWED', 'Delivery tidak dapat di-retry.', 409);
      await admin.from('central_lead_delivery_audit').insert({ delivery_id: deliveryId, action: 'delivery.manual_retry', metadata: { actor_user_id: userId } });
      return jsonResponse({ data });
    }
    if (action === 'installations') {
      const { data, error } = await admin.from('tenant_installations').select('id,tenant_id,base_url,environment,app_version,status,last_heartbeat_at,last_sync_at,updated_at,tenant_registry(name,slug,custom_domain)').order('updated_at', { ascending: false });
      if (error) throw error;
      return jsonResponse({ data: data || [] });
    }
    return fail('UNKNOWN_ACTION', `Action tidak dikenal: ${action}.`);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'LEAD_ADMIN_FAILED';
    return fail(code, code === 'FORBIDDEN' ? 'Akses admin diperlukan.' : 'Operasi observability gagal.', code === 'UNAUTHENTICATED' ? 401 : code === 'FORBIDDEN' ? 403 : 500);
  }
});
