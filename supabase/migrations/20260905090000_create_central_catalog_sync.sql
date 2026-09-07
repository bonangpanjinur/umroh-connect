-- Fase 2: katalog produk terpusat dan synchronization engine.

CREATE TABLE IF NOT EXISTS public.central_catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  source_id UUID NOT NULL,
  source_version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'umroh',
  description TEXT,
  highlights TEXT,
  price_single NUMERIC(15,2),
  price_double NUMERIC(15,2),
  price_triple NUMERIC(15,2),
  price_quad NUMERIC(15,2),
  duration_days INTEGER,
  departure_city TEXT,
  airline TEXT,
  includes JSONB NOT NULL DEFAULT '[]'::JSONB,
  excludes JSONB NOT NULL DEFAULT '[]'::JSONB,
  photo_url TEXT,
  gallery_urls JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT false,
  source_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source_id)
);

CREATE TABLE IF NOT EXISTS public.central_catalog_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.central_catalog_products(id) ON DELETE CASCADE,
  source_id UUID NOT NULL,
  source_version INTEGER NOT NULL DEFAULT 1,
  departure_date DATE NOT NULL,
  return_date DATE,
  quota INTEGER,
  available_seats INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  source_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_resource_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  central_id UUID NOT NULL,
  source_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, resource_type, source_id),
  UNIQUE (tenant_id, resource_type, central_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  installation_id UUID REFERENCES public.tenant_installations(id) ON DELETE SET NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_version INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed'
    CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error_code TEXT,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (tenant_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_sync_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_registry(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  cursor_version INTEGER NOT NULL DEFAULT 0,
  last_reconciled_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_catalog_products_tenant_active ON public.central_catalog_products(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_departures_tenant_date ON public.central_catalog_departures(tenant_id, departure_date);
CREATE INDEX IF NOT EXISTS idx_sync_events_tenant_received ON public.tenant_sync_events(tenant_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON public.tenant_sync_events(status, received_at);

ALTER TABLE public.central_catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_catalog_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_resource_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_sync_cursors ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.central_catalog_products, public.central_catalog_departures TO anon, authenticated;
GRANT SELECT ON public.tenant_resource_mappings, public.tenant_sync_events, public.tenant_sync_cursors TO authenticated;
GRANT ALL ON public.central_catalog_products, public.central_catalog_departures, public.tenant_resource_mappings, public.tenant_sync_events, public.tenant_sync_cursors TO service_role;

DROP POLICY IF EXISTS "Public can view active central catalog" ON public.central_catalog_products;
CREATE POLICY "Public can view active central catalog" ON public.central_catalog_products FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Public can view active central departures" ON public.central_catalog_departures;
CREATE POLICY "Public can view active central departures" ON public.central_catalog_departures FOR SELECT TO anon, authenticated USING (status IN ('published', 'active'));
DROP POLICY IF EXISTS "Admins view sync events" ON public.tenant_sync_events;
CREATE POLICY "Admins view sync events" ON public.tenant_sync_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "Admins view sync cursors" ON public.tenant_sync_cursors;
CREATE POLICY "Admins view sync cursors" ON public.tenant_sync_cursors FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
