-- Add lifecycle status (draft/active/closed) to packages
DO $$ BEGIN
  CREATE TYPE public.package_status AS ENUM ('draft', 'active', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS status public.package_status NOT NULL DEFAULT 'draft';

-- Backfill: existing active packages -> 'active', else 'draft'
UPDATE public.packages
SET status = CASE WHEN is_active = true THEN 'active'::public.package_status
                  ELSE 'draft'::public.package_status END
WHERE status = 'draft';

-- Keep is_active in sync with status for backward compatibility
CREATE OR REPLACE FUNCTION public.sync_package_is_active()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END; $fn$;

DROP TRIGGER IF EXISTS trg_sync_package_is_active ON public.packages;
CREATE TRIGGER trg_sync_package_is_active
BEFORE INSERT OR UPDATE OF status ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.sync_package_is_active();

CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);