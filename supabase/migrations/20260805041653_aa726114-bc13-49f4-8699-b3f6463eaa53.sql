ALTER TABLE public.manifest_pilgrims
  ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN approved_by UUID,
  ADD COLUMN rejection_reason TEXT;

CREATE OR REPLACE FUNCTION public.validate_manifest_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Status persetujuan manifest tidak valid: %', NEW.approval_status;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NEW.approval_status = 'approved' THEN
      NEW.approved_at := now();
      NEW.approved_by := auth.uid();
      NEW.rejection_reason := NULL;
    ELSE
      NEW.approved_at := NULL;
      NEW.approved_by := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_manifest_approval
BEFORE INSERT OR UPDATE ON public.manifest_pilgrims
FOR EACH ROW EXECUTE FUNCTION public.validate_manifest_approval();

CREATE INDEX idx_manifest_pilgrims_approval ON public.manifest_pilgrims(departure_id, approval_status);