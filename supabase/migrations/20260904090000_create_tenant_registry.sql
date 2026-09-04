-- Fase 1: Tenant registry dan onboarding pusat
-- Credential secret mentah tidak pernah disimpan; hanya hash yang disimpan.

CREATE TABLE IF NOT EXISTS public.tenant_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  base_url TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production'
    CHECK (environment IN ('production', 'staging', 'development')),
  app_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connected', 'degraded', 'disabled')),
  last_heartbeat_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, environment),
  UNIQUE (base_url, environment)
);

CREATE TABLE IF NOT EXISTS public.tenant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL REFERENCES public.tenant_installations(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL UNIQUE,
  secret_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['catalog.write', 'catalog.reconcile', 'health.read']::TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_integration_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.tenant_credentials(id) ON DELETE CASCADE,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (credential_id, nonce)
);

CREATE TABLE IF NOT EXISTS public.tenant_registry_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenant_registry(id) ON DELETE SET NULL,
  installation_id UUID REFERENCES public.tenant_installations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_installations_tenant_id
  ON public.tenant_installations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_credentials_installation_id
  ON public.tenant_credentials(installation_id);
CREATE INDEX IF NOT EXISTS idx_tenant_nonces_expiry
  ON public.tenant_integration_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_tenant_created
  ON public.tenant_registry_audit_logs(tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_tenant_registry_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenant_registry_updated_at ON public.tenant_registry;
CREATE TRIGGER trg_tenant_registry_updated_at
BEFORE UPDATE ON public.tenant_registry
FOR EACH ROW EXECUTE FUNCTION public.touch_tenant_registry_updated_at();

DROP TRIGGER IF EXISTS trg_tenant_installations_updated_at ON public.tenant_installations;
CREATE TRIGGER trg_tenant_installations_updated_at
BEFORE UPDATE ON public.tenant_installations
FOR EACH ROW EXECUTE FUNCTION public.touch_tenant_registry_updated_at();

ALTER TABLE public.tenant_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_integration_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_registry_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.tenant_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tenant_installations TO authenticated;
GRANT SELECT ON public.tenant_credentials TO authenticated;
GRANT SELECT ON public.tenant_registry_audit_logs TO authenticated;
GRANT ALL ON public.tenant_registry, public.tenant_installations, public.tenant_credentials,
  public.tenant_integration_nonces, public.tenant_registry_audit_logs TO service_role;

DROP POLICY IF EXISTS "Platform admins manage tenant registry" ON public.tenant_registry;
CREATE POLICY "Platform admins manage tenant registry"
ON public.tenant_registry FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Platform admins manage tenant installations" ON public.tenant_installations;
CREATE POLICY "Platform admins manage tenant installations"
ON public.tenant_installations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Platform admins view tenant credentials" ON public.tenant_credentials;
CREATE POLICY "Platform admins view tenant credentials"
ON public.tenant_credentials FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Platform admins view tenant audit" ON public.tenant_registry_audit_logs;
CREATE POLICY "Platform admins view tenant audit"
ON public.tenant_registry_audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

REVOKE ALL ON FUNCTION public.touch_tenant_registry_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_tenant_registry_updated_at() TO service_role;
