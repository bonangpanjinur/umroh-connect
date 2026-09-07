import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/auth.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const hex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
const hmac = async (secret: string, value: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
};
const constantTimeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((ok, char, i) => ok & (char === b[i] ? 1 : 0), 1) === 1;
const fail = (code: string, message: string, status = 400) => jsonResponse({ error: { code, message, retryable: status >= 500 } }, status);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Gunakan POST.', 405);
  try {
    const keyId = req.headers.get('x-integration-key') || '';
    const signature = req.headers.get('x-integration-signature') || '';
    const timestamp = req.headers.get('x-integration-timestamp') || '';
    const nonce = req.headers.get('x-integration-nonce') || '';
    const bodyText = await req.text();
    if (!keyId || !signature || !timestamp || !nonce) return fail('INTEGRATION_HEADERS_REQUIRED', 'Header integrasi belum lengkap.', 401);
    const timestampMs = Number(timestamp);
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 300_000) return fail('SIGNATURE_EXPIRED', 'Timestamp request sudah kedaluwarsa.', 401);
    const payload = JSON.parse(bodyText) as { event_id?: string; event_type?: string; occurred_at?: string; source?: { installation_id?: string; entity_id?: string; entity_version?: number }; data?: Record<string, unknown> };
    if (!payload.event_id || !payload.event_type || !payload.source?.installation_id || !payload.source.entity_id || !Number.isInteger(payload.source.entity_version)) return fail('INVALID_EVENT', 'Envelope event katalog tidak lengkap.');

    const { data: credential } = await admin.from('tenant_credentials').select('id,installation_id,secret_hash,scopes,revoked_at,expires_at').eq('key_id', keyId).maybeSingle();
    if (!credential || credential.revoked_at || (credential.expires_at && new Date(credential.expires_at) <= new Date())) return fail('INVALID_CREDENTIAL', 'Credential tidak valid.', 401);
    if (credential.installation_id !== payload.source.installation_id) return fail('INSTALLATION_MISMATCH', 'Installation tidak sesuai credential.', 403);
    const { data: installation } = await admin.from('tenant_installations').select('id,tenant_id,status').eq('id', credential.installation_id).maybeSingle();
    if (!installation || installation.status === 'disabled') return fail('INSTALLATION_DISABLED', 'Installation tidak aktif.', 403);

    // Credential secret mentah tidak perlu disimpan di pusat. Hash yang tersimpan
    // digunakan sebagai derived HMAC key; instalasi travel menggunakan sha256(secret).
    const derivedKey = credential.secret_hash;
    const bodyHash = await sha256(bodyText);
    const canonical = `${req.method}\n${new URL(req.url).pathname}\n${timestamp}\n${nonce}\n${bodyHash}`;
    const expected = await hmac(derivedKey, canonical);
    if (!constantTimeEqual(expected, signature)) return fail('INVALID_SIGNATURE', 'Signature request tidak valid.', 401);

    const { error: nonceError } = await admin.from('tenant_integration_nonces').insert({ credential_id: credential.id, nonce, expires_at: new Date(Date.now() + 300_000).toISOString() });
    if (nonceError?.code === '23505') return fail('NONCE_REPLAYED', 'Nonce sudah pernah digunakan.', 409);
    if (nonceError) throw nonceError;

    const entityType = payload.event_type.startsWith('package.') ? 'package' : payload.event_type.startsWith('departure.') ? 'departure' : null;
    if (!entityType) return fail('UNSUPPORTED_EVENT', `Event ${payload.event_type} belum didukung.`);
    const { data: existing } = await admin.from('tenant_sync_events').select('id,entity_version,status').eq('tenant_id', installation.tenant_id).eq('event_id', payload.event_id).maybeSingle();
    if (existing) return jsonResponse({ data: { event_id: payload.event_id, status: 'duplicate', entity_version: existing.entity_version } });

    const { data: prior } = await admin.from('tenant_resource_mappings').select('central_id,source_version').eq('tenant_id', installation.tenant_id).eq('resource_type', entityType).eq('source_id', payload.source.entity_id).maybeSingle();
    if (prior && prior.source_version >= payload.source.entity_version) {
      await admin.from('tenant_sync_events').insert({ tenant_id: installation.tenant_id, installation_id: installation.id, event_id: payload.event_id, event_type: payload.event_type, entity_type: entityType, entity_id: payload.source.entity_id, entity_version: payload.source.entity_version, occurred_at: payload.occurred_at || new Date().toISOString(), payload, status: 'ignored', processed_at: new Date().toISOString() });
      return jsonResponse({ data: { event_id: payload.event_id, status: 'stale' } });
    }

    let centralId = prior?.central_id;
    if (entityType === 'package') {
      const d = payload.data || {};
      if (d.deleted === true) {
        const { error } = await admin.from('central_catalog_products').update({ is_active: false, source_version: payload.source.entity_version, synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', installation.tenant_id).eq('source_id', payload.source.entity_id);
        if (error) throw error;
        centralId = prior?.central_id;
      } else {
      const row = { tenant_id: installation.tenant_id, source_id: payload.source.entity_id, source_version: payload.source.entity_version, name: String(d.name || 'Untitled'), package_type: String(d.package_type || 'umroh'), description: d.description ?? null, highlights: d.highlights ?? null, price_single: d.price_single ?? null, price_double: d.price_double ?? null, price_triple: d.price_triple ?? null, price_quad: d.price_quad ?? null, duration_days: d.duration_days ?? null, departure_city: d.departure_city ?? null, airline: d.airline ?? null, includes: d.includes || [], excludes: d.excludes || [], photo_url: d.photo_url ?? null, gallery_urls: d.gallery_urls || [], is_active: d.is_active === true, source_updated_at: d.updated_at ?? null, synced_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { data, error } = await admin.from('central_catalog_products').upsert(row, { onConflict: 'tenant_id,source_id' }).select('id').single();
      if (error) throw error;
      centralId = data.id;
      }
    } else {
      const d = payload.data || {};
      if (d.deleted === true) {
        const { error } = await admin.from('central_catalog_departures').update({ status: 'cancelled', source_version: payload.source.entity_version, synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', installation.tenant_id).eq('source_id', payload.source.entity_id);
        if (error) throw error;
        centralId = prior?.central_id;
      } else {
      const packageSourceId = String(d.package_id || '');
      const { data: product } = await admin.from('central_catalog_products').select('id').eq('tenant_id', installation.tenant_id).eq('source_id', packageSourceId).maybeSingle();
      if (!product) return fail('PARENT_NOT_FOUND', 'Package induk belum tersinkronkan.', 409);
      const row = { tenant_id: installation.tenant_id, product_id: product.id, source_id: payload.source.entity_id, source_version: payload.source.entity_version, departure_date: d.departure_date, return_date: d.return_date ?? null, quota: d.quota ?? null, available_seats: d.available_seats ?? null, status: String(d.status || 'draft'), source_updated_at: d.updated_at ?? null, synced_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { data, error } = await admin.from('central_catalog_departures').upsert(row, { onConflict: 'tenant_id,source_id' }).select('id').single();
      if (error) throw error;
      centralId = data.id;
      }
    }
    await admin.from('tenant_resource_mappings').upsert({ tenant_id: installation.tenant_id, resource_type: entityType, source_id: payload.source.entity_id, central_id: centralId, source_version: payload.source.entity_version, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,resource_type,source_id' });
    await admin.from('tenant_sync_events').insert({ tenant_id: installation.tenant_id, installation_id: installation.id, event_id: payload.event_id, event_type: payload.event_type, entity_type: entityType, entity_id: payload.source.entity_id, entity_version: payload.source.entity_version, occurred_at: payload.occurred_at || new Date().toISOString(), payload, status: 'processed', processed_at: new Date().toISOString() });
    await admin.from('tenant_installations').update({ status: 'connected', last_sync_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() }).eq('id', installation.id);
    return jsonResponse({ data: { event_id: payload.event_id, status: 'processed', central_id: centralId } }, 202);
  } catch (error) {
    console.error('catalog-ingest failed', error);
    return jsonResponse({ error: { code: 'CATALOG_INGEST_FAILED', message: 'Event katalog gagal diproses.', retryable: true } }, 500);
  }
});
