-- Channel registry pusat bersifat mirror/observability dari website channel travel.
-- Tenant tetap travel pusat; branch/agent hanya metadata attribution.
ALTER TABLE public.central_leads
  ADD COLUMN IF NOT EXISTS source_channel TEXT NOT NULL DEFAULT 'central',
  ADD COLUMN IF NOT EXISTS channel_id TEXT,
  ADD COLUMN IF NOT EXISTS channel_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.tenant_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  channel_id TEXT,
  domain TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'central' CHECK (channel_type IN ('central', 'branch', 'agent')),
  branch_id TEXT,
  agent_id TEXT,
  default_pic_user_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_tenant_channels_tenant ON public.tenant_channels(tenant_id, channel_type, domain);
CREATE INDEX IF NOT EXISTS idx_central_leads_channel ON public.central_leads(tenant_id, source_channel, source_domain, created_at DESC);
ALTER TABLE public.tenant_channels ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tenant_channels TO authenticated;
GRANT ALL ON public.tenant_channels TO service_role;
DROP POLICY IF EXISTS "Admins view tenant channels" ON public.tenant_channels;
CREATE POLICY "Admins view tenant channels" ON public.tenant_channels FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
