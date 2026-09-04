import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getUserId, jsonResponse } from '../_shared/auth.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const json = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const randomToken = (bytes = 32) => {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return btoa(String.fromCharCode(...values)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const isPlatformAdmin = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'super_admin'])
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
};

const audit = async (input: {
  tenantId?: string | null;
  installationId?: string | null;
  actorUserId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) => {
  const { error } = await supabaseAdmin.from('tenant_registry_audit_logs').insert({
    tenant_id: input.tenantId ?? null,
    installation_id: input.installationId ?? null,
    actor_user_id: input.actorUserId,
    action: input.action,
    metadata: input.metadata ?? {},
  });
  if (error) console.error('tenant audit insert failed', error.message);
};

const fail = (code: string, message: string, status = 400, retryable = false) =>
  jsonResponse({ error: { code, message, retryable } }, status);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  try {
    const userId = await getUserId(req);
    if (!userId) return fail('UNAUTHENTICATED', 'Sesi admin tidak valid.', 401);
    if (!(await isPlatformAdmin(userId))) return fail('FORBIDDEN', 'Akses hanya untuk admin platform.', 403);

    const body = req.method === 'GET' ? {} : await req.json().catch(() => null);
    if (req.method !== 'GET' && !body) return fail('INVALID_JSON', 'Body JSON tidak valid.');

    const url = new URL(req.url);
    const action = String(body?.action || url.searchParams.get('action') || 'list');

    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from('tenant_registry')
        .select('id,name,slug,custom_domain,status,verified_at,created_at,updated_at,tenant_installations(id,base_url,environment,app_version,status,last_heartbeat_at,last_sync_at,created_at,updated_at)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return jsonResponse({ data, meta: { request_id: requestId } });
    }

    if (action === 'create') {
      const name = String(body?.name || '').trim();
      const slug = String(body?.slug || '').trim().toLowerCase();
      const baseUrl = String(body?.base_url || '').trim();
      const environment = String(body?.environment || 'production');
      const customDomain = String(body?.custom_domain || '').trim() || null;
      if (!name || !slug || !baseUrl) return fail('INVALID_TENANT_INPUT', 'name, slug, dan base_url wajib diisi.');
      if (!['production', 'staging', 'development'].includes(environment)) return fail('INVALID_ENVIRONMENT', 'environment tidak valid.');
      try { new URL(baseUrl); } catch { return fail('INVALID_BASE_URL', 'base_url harus berupa URL yang valid.'); }
      if (customDomain && customDomain.includes('://')) return fail('INVALID_DOMAIN', 'custom_domain hanya boleh berupa hostname.');

      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenant_registry')
        .insert({ name, slug, custom_domain: customDomain })
        .select('id,name,slug,custom_domain,status,created_at')
        .single();
      if (tenantError) return fail(tenantError.code === '23505' ? 'TENANT_ALREADY_EXISTS' : 'TENANT_CREATE_FAILED', tenantError.message, tenantError.code === '23505' ? 409 : 500);

      const { data: installation, error: installationError } = await supabaseAdmin
        .from('tenant_installations')
        .insert({ tenant_id: tenant.id, base_url: baseUrl, environment })
        .select('id,tenant_id,base_url,environment,status,created_at')
        .single();
      if (installationError) {
        await supabaseAdmin.from('tenant_registry').delete().eq('id', tenant.id);
        return fail('INSTALLATION_CREATE_FAILED', installationError.message, 500);
      }

      const keyId = `uk_${randomToken(12)}`;
      const secret = `us_${randomToken(36)}`;
      const { error: credentialError } = await supabaseAdmin.from('tenant_credentials').insert({
        installation_id: installation.id,
        key_id: keyId,
        secret_hash: await sha256(secret),
        scopes: ['catalog.write', 'catalog.reconcile', 'health.read'],
      });
      if (credentialError) {
        await supabaseAdmin.from('tenant_installations').delete().eq('id', installation.id);
        await supabaseAdmin.from('tenant_registry').delete().eq('id', tenant.id);
        return fail('CREDENTIAL_CREATE_FAILED', credentialError.message, 500);
      }

      await audit({ tenantId: tenant.id, installationId: installation.id, actorUserId: userId, action: 'tenant.created', metadata: { environment, key_id: keyId } });
      return jsonResponse({ data: { tenant, installation, credential: { key_id: keyId, secret, scopes: ['catalog.write', 'catalog.reconcile', 'health.read'] } }, meta: { request_id: requestId, secret_display: 'one_time' } }, 201);
    }

    const installationId = String(body?.installation_id || url.searchParams.get('installation_id') || '').trim();
    if (!installationId) return fail('INSTALLATION_REQUIRED', 'installation_id wajib diisi.');
    const { data: installation, error: installationError } = await supabaseAdmin.from('tenant_installations').select('id,tenant_id,base_url,environment,status').eq('id', installationId).maybeSingle();
    if (installationError) throw installationError;
    if (!installation) return fail('INSTALLATION_NOT_FOUND', 'Installation tidak ditemukan.', 404);

    if (action === 'revoke' || action === 'rotate') {
      const { data: current, error: currentError } = await supabaseAdmin.from('tenant_credentials').select('id,key_id').eq('installation_id', installationId).is('revoked_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (currentError) throw currentError;
      if (action === 'revoke') {
        if (current) await supabaseAdmin.from('tenant_credentials').update({ revoked_at: new Date().toISOString() }).eq('id', current.id);
        await supabaseAdmin.from('tenant_installations').update({ status: 'disabled' }).eq('id', installationId);
        await audit({ tenantId: installation.tenant_id, installationId, actorUserId: userId, action: 'credential.revoked', metadata: { key_id: current?.key_id ?? null } });
        return jsonResponse({ data: { installation_id: installationId, status: 'disabled' }, meta: { request_id: requestId } });
      }
      if (current) await supabaseAdmin.from('tenant_credentials').update({ revoked_at: new Date().toISOString() }).eq('id', current.id);
      const keyId = `uk_${randomToken(12)}`;
      const secret = `us_${randomToken(36)}`;
      const { error } = await supabaseAdmin.from('tenant_credentials').insert({ installation_id: installationId, key_id: keyId, secret_hash: await sha256(secret), scopes: ['catalog.write', 'catalog.reconcile', 'health.read'] });
      if (error) throw error;
      await supabaseAdmin.from('tenant_installations').update({ status: 'pending' }).eq('id', installationId);
      await audit({ tenantId: installation.tenant_id, installationId, actorUserId: userId, action: 'credential.rotated', metadata: { key_id: keyId } });
      return jsonResponse({ data: { installation_id: installationId, credential: { key_id: keyId, secret, scopes: ['catalog.write', 'catalog.reconcile', 'health.read'] } }, meta: { request_id: requestId, secret_display: 'one_time' } });
    }

    return fail('UNKNOWN_ACTION', `Action tidak dikenal: ${action}.`);
  } catch (error) {
    console.error('tenant-admin failed', error);
    return jsonResponse({ error: { code: 'TENANT_ADMIN_FAILED', message: 'Operasi tenant gagal diproses.', request_id: requestId, retryable: false } }, 500);
  }
});
