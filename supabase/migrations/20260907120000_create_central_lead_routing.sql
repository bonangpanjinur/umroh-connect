-- Fase 3: lead intake pusat dan delivery queue per tenant.
CREATE TABLE IF NOT EXISTS public.central_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.central_catalog_products(id) ON DELETE SET NULL,
  source_domain TEXT,
  idempotency_key TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'umroh-connect',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'delivered', 'accepted', 'rejected', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.central_lead_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.central_leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  installation_id UUID NOT NULL REFERENCES public.tenant_installations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'accepted', 'rejected', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, installation_id)
);

CREATE TABLE IF NOT EXISTS public.central_lead_delivery_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.central_lead_deliveries(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_central_leads_tenant_created ON public.central_leads(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_deliveries_claim ON public.central_lead_deliveries(installation_id, status, available_at, created_at);

ALTER TABLE public.central_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_lead_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_lead_delivery_audit ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.central_leads, public.central_lead_deliveries, public.central_lead_delivery_audit TO authenticated;
GRANT ALL ON public.central_leads, public.central_lead_deliveries, public.central_lead_delivery_audit TO service_role;
DROP POLICY IF EXISTS "Admins view central leads" ON public.central_leads;
CREATE POLICY "Admins view central leads" ON public.central_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "Admins view lead deliveries" ON public.central_lead_deliveries;
CREATE POLICY "Admins view lead deliveries" ON public.central_lead_deliveries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
