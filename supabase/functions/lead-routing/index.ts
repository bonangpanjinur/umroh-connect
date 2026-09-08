import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getUserId, jsonResponse } from '../_shared/auth.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const hex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
const hmac = async (secret: string, value: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
};
const equal = (a: string, b: string) => a.length === b.length && [...a].every((c, i) => c === b[i]);
const fail = (code: string, message: string, status = 400) => jsonResponse({ error: { code, message, retryable: status >= 500 } }, status);

async function authenticate(req: Request, bodyText: string) {
  const keyId = req.headers.get('x-integration-key') || '';
  const signature = req.headers.get('x-integration-signature') || '';
  const timestamp = req.headers.get('x-integration-timestamp') || '';
  const nonce = req.headers.get('x-integration-nonce') || '';
  if (!keyId || !signature || !timestamp || !nonce) throw new Error('INTEGRATION_HEADERS_REQUIRED');
  if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() - Number(timestamp)) > 300_000) throw new Error('SIGNATURE_EXPIRED');
  const { data: credential } = await admin.from('tenant_credentials').select('id,installation_id,secret_hash,scopes,revoked_at,expires_at').eq('key_id', keyId).maybeSingle();
  if (!credential || credential.revoked_at || (credential.expires_at && new Date(credential.expires_at) <= new Date())) throw new Error('INVALID_CREDENTIAL');
  const bodyHash = await sha256(bodyText);
  const canonical = `${req.method}\n${new URL(req.url).pathname}\n${timestamp}\n${nonce}\n${bodyHash}`;
  if (!equal(await hmac(credential.secret_hash, canonical), signature)) throw new Error('INVALID_SIGNATURE');
  const { error } = await admin.from('tenant_integration_nonces').insert({ credential_id: credential.id, nonce, expires_at: new Date(Date.now() + 300_000).toISOString() });
  if (error?.code === '23505') throw new Error('NONCE_REPLAYED');
  if (error) throw error;
  const { data: installation } = await admin.from('tenant_installations').select('id,tenant_id,status').eq('id', credential.installation_id).maybeSingle();
  if (!installation || installation.status === 'disabled') throw new Error('INSTALLATION_DISABLED');
  return { credential, installation };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const action = String(body.action || 'submit');

    if (action === 'submit') {
      const fullName = String(body.full_name || '').trim();
      const phone = String(body.phone || '').trim();
      const email = body.email ? String(body.email).trim() : null;
      const message = body.message ? String(body.message).trim() : null;
      const productId = body.product_id ? String(body.product_id) : null;
      const sourceDomain = body.source_domain ? String(body.source_domain).toLowerCase().trim() : null;
      const idempotencyKey = String(req.headers.get('idempotency-key') || body.idempotency_key || '').trim();
      if (!fullName || !phone || !idempotencyKey) return fail('INVALID_LEAD_INPUT', 'full_name, phone, dan Idempotency-Key wajib diisi.');
      let tenantId: string | null = null;
      if (productId) {
        const { data: product } = await admin.from('central_catalog_products').select('tenant_id').eq('id', productId).eq('is_active', true).maybeSingle();
        tenantId = product?.tenant_id || null;
      }
      if (!tenantId && sourceDomain) {
        const { data: tenant } = await admin.from('tenant_registry').select('id').eq('custom_domain', sourceDomain).eq('status', 'active').maybeSingle();
        tenantId = tenant?.id || null;
      }
      if (!tenantId) return fail('TENANT_ROUTE_NOT_FOUND', 'Lead tidak dapat diarahkan ke travel.', 404);
      const { data: existing } = await admin.from('central_leads').select('id,status').eq('tenant_id', tenantId).eq('idempotency_key', idempotencyKey).maybeSingle();
      if (existing) return jsonResponse({ data: { lead_id: existing.id, status: 'duplicate', lead_status: existing.status } });
      const { data: installation } = await admin.from('tenant_installations').select('id').eq('tenant_id', tenantId).eq('environment', 'production').neq('status', 'disabled').maybeSingle();
      if (!installation) return fail('TENANT_NOT_CONNECTED', 'Travel belum memiliki installation aktif.', 409);
      const { data: lead, error } = await admin.from('central_leads').insert({ tenant_id: tenantId, product_id: productId, source_domain: sourceDomain, idempotency_key: idempotencyKey, full_name: fullName, phone, email, message }).select('id,tenant_id,product_id,status,created_at').single();
      if (error) throw error;
      const { error: deliveryError } = await admin.from('central_lead_deliveries').insert({ lead_id: lead.id, tenant_id: tenantId, installation_id: installation.id });
      if (deliveryError) throw deliveryError;
      return jsonResponse({ data: { lead_id: lead.id, tenant_id: tenantId, status: 'queued' } }, 202);
    }

    const auth = await authenticate(req, bodyText);
    const scopes = Array.isArray(auth.credential.scopes) ? auth.credential.scopes as string[] : [];
    const requireScope = (scope: string) => {
      if (!scopes.includes(scope)) throw new Error('SCOPE_FORBIDDEN');
    };
    if (action === 'pull') {
      requireScope('lead.read');
      const limit = Math.min(50, Math.max(1, Number(body.limit || 20)));
      const { data: deliveries, error } = await admin.from('central_lead_deliveries').select('id,lead_id,attempts,central_leads(id,full_name,phone,email,message,product_id,source_domain,created_at,central_catalog_products(name,source_id))').eq('installation_id', auth.installation.id).eq('status', 'pending').lte('available_at', new Date().toISOString()).order('created_at', { ascending: true }).limit(limit);
      if (error) throw error;
      const claimedAt = new Date().toISOString();
      const claimed = [];
      for (const delivery of deliveries || []) {
        const { data: updated, error: claimError } = await admin.from('central_lead_deliveries').update({ status: 'claimed', claimed_at: claimedAt, attempts: Number(delivery.attempts || 0) + 1, updated_at: claimedAt }).eq('id', delivery.id).eq('status', 'pending').select('id').maybeSingle();
        if (claimError) throw claimError;
        if (updated) claimed.push(delivery);
      }
      return jsonResponse({ data: claimed });
    }
    if (action === 'ack') {
      requireScope('lead.write');
      const deliveryId = String(body.delivery_id || '');
      const status = body.status === 'rejected' ? 'rejected' : 'accepted';
      if (!deliveryId) return fail('DELIVERY_REQUIRED', 'delivery_id wajib diisi.');
      const { data: delivery } = await admin.from('central_lead_deliveries').select('id,lead_id,installation_id').eq('id', deliveryId).eq('installation_id', auth.installation.id).maybeSingle();
      if (!delivery) return fail('DELIVERY_NOT_FOUND', 'Delivery tidak ditemukan.', 404);
      await admin.from('central_lead_deliveries').update({ status, accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', deliveryId);
      await admin.from('central_leads').update({ status, updated_at: new Date().toISOString() }).eq('id', delivery.lead_id);
      await admin.from('central_lead_delivery_audit').insert({ delivery_id: deliveryId, action: `delivery.${status}`, metadata: { installation_id: auth.installation.id } });
      return jsonResponse({ data: { delivery_id: deliveryId, status } });
    }
    return fail('UNKNOWN_ACTION', `Action tidak dikenal: ${action}.`);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'LEAD_ROUTING_FAILED';
    const status = ['INTEGRATION_HEADERS_REQUIRED', 'SIGNATURE_EXPIRED', 'INVALID_CREDENTIAL', 'INVALID_SIGNATURE', 'NONCE_REPLAYED'].includes(code) ? 401 : code === 'SCOPE_FORBIDDEN' ? 403 : 500;
    return fail(code, 'Lead routing gagal diproses.', status);
  }
});
