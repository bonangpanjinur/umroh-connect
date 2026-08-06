CREATE TABLE public.manifest_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilgrim_id UUID,
  departure_id UUID,
  travel_id UUID NOT NULL,
  booking_id UUID,
  pilgrim_name TEXT,
  action TEXT NOT NULL,
  old_approval_status TEXT,
  new_approval_status TEXT,
  rejection_reason TEXT,
  changed_fields TEXT[],
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.manifest_audit_log TO authenticated;
GRANT ALL ON public.manifest_audit_log TO service_role;

ALTER TABLE public.manifest_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own travel manifest audit"
ON public.manifest_audit_log FOR SELECT TO authenticated
USING (public.owns_travel(auth.uid(), travel_id) OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_manifest_audit_departure_created ON public.manifest_audit_log (departure_id, created_at DESC);
CREATE INDEX idx_manifest_audit_travel_created ON public.manifest_audit_log (travel_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_manifest_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  act TEXT;
  fields TEXT[] := '{}';
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.manifest_audit_log (pilgrim_id, departure_id, travel_id, booking_id, pilgrim_name, action, new_approval_status, changed_by)
    VALUES (NEW.id, NEW.departure_id, NEW.travel_id, NEW.booking_id, NEW.full_name, 'created', NEW.approval_status, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.manifest_audit_log (pilgrim_id, departure_id, travel_id, booking_id, pilgrim_name, action, old_approval_status, changed_by)
    VALUES (OLD.id, OLD.departure_id, OLD.travel_id, OLD.booking_id, OLD.full_name, 'deleted', OLD.approval_status, auth.uid());
    RETURN OLD;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    act := CASE NEW.approval_status
      WHEN 'approved' THEN 'approved'
      WHEN 'rejected' THEN 'rejected'
      ELSE 'reset_pending'
    END;
  ELSE
    act := 'updated';
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN fields := array_append(fields, 'full_name'); END IF;
    IF NEW.gender IS DISTINCT FROM OLD.gender THEN fields := array_append(fields, 'gender'); END IF;
    IF NEW.birth_date IS DISTINCT FROM OLD.birth_date THEN fields := array_append(fields, 'birth_date'); END IF;
    IF NEW.nik IS DISTINCT FROM OLD.nik THEN fields := array_append(fields, 'nik'); END IF;
    IF NEW.passport_number IS DISTINCT FROM OLD.passport_number THEN fields := array_append(fields, 'passport_number'); END IF;
    IF NEW.passport_expiry IS DISTINCT FROM OLD.passport_expiry THEN fields := array_append(fields, 'passport_expiry'); END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN fields := array_append(fields, 'phone'); END IF;
    IF NEW.mahram_name IS DISTINCT FROM OLD.mahram_name THEN fields := array_append(fields, 'mahram_name'); END IF;
    IF NEW.room_type IS DISTINCT FROM OLD.room_type THEN fields := array_append(fields, 'room_type'); END IF;
    IF NEW.room_number IS DISTINCT FROM OLD.room_number THEN fields := array_append(fields, 'room_number'); END IF;
    IF NEW.bus_number IS DISTINCT FROM OLD.bus_number THEN fields := array_append(fields, 'bus_number'); END IF;
    IF NEW.notes IS DISTINCT FROM OLD.notes THEN fields := array_append(fields, 'notes'); END IF;
    IF array_length(fields, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.manifest_audit_log (pilgrim_id, departure_id, travel_id, booking_id, pilgrim_name, action, old_approval_status, new_approval_status, rejection_reason, changed_fields, changed_by)
  VALUES (NEW.id, NEW.departure_id, NEW.travel_id, NEW.booking_id, NEW.full_name, act, OLD.approval_status, NEW.approval_status, NEW.rejection_reason, fields, auth.uid());

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_manifest_change
AFTER INSERT OR UPDATE OR DELETE ON public.manifest_pilgrims
FOR EACH ROW EXECUTE FUNCTION public.log_manifest_change();