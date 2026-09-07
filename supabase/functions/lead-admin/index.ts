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
      const [leads, deliveries, installations, events] = await Promise.all([
        admin.from('central_leads').select('status', { count: 'exact', head: false }).order('created_at', { ascending: false }).limit(1000),
        admin.from('central_lead_deliveries').select('status', { count: 'exact', head: false }).order('created_at', { ascending: false }).limit(1000),
        admin.from('tenant_installations').select('status,last_heartbeat_at,last_sync_at', { count: 'exact', head: false }),
        admin.from('tenant_sync_events').select('status', { count: 'exact', head: false }).order('received_at', { ascending: false }).limit(1000),
      ]);
      const count = (rows: Array<{ status?: string }> | null, status: string) => (rows || []).filter((row) => row.status === status).length;
      return jsonResponse({ data: {
        leads: { total: leads.data?.length || 0, queued: count(leads.data, 'queued'), delivered: count(leads.data, 'delivered'), accepted: count(leads.data, 'accepted'), rejected: count(leads.data, 'rejected') },
        deliveries: { total: deliveries.data?.length || 0, pending: count(deliveries.data, 'pending'), claimed: count(deliveries.data, 'claimed'), accepted: count(deliveries.data, 'accepted'), rejected: count(deliveries.data, 'rejected'), dead_letter: count(deliveries.data, 'dead_letter') },
        installations: { total: installations.data?.length || 0, connected: count(installations.data, 'connected'), degraded: count(installations.data, 'degraded'), disabled: count(installations.data, 'disabled') },
        sync_events: { total: events.data?.length || 0, processed: count(events.data, 'processed'), failed: count(events.data, 'failed'), ignored: count(events.data, 'ignored') },
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
