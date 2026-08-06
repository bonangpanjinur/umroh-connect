ALTER TABLE public.manifest_audit_log
  ADD COLUMN IF NOT EXISTS old_values JSONB,
  ADD COLUMN IF NOT EXISTS new_values JSONB;

CREATE OR REPLACE FUNCTION public.log_manifest_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  act TEXT;
  fields TEXT[] := '{}';
  oldv JSONB := '{}'::jsonb;
  newv JSONB := '{}'::jsonb;
  f TEXT;
  old_json JSONB;
  new_json JSONB;
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

  old_json := to_jsonb(OLD);
  new_json := to_jsonb(NEW);

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    act := CASE NEW.approval_status
      WHEN 'approved' THEN 'approved'
      WHEN 'rejected' THEN 'rejected'
      ELSE 'reset_pending'
    END;
  ELSE
    act := 'updated';
    FOREACH f IN ARRAY ARRAY['full_name','gender','birth_date','nik','passport_number','passport_expiry','phone','mahram_name','room_type','room_number','bus_number','notes'] LOOP
      IF (new_json -> f) IS DISTINCT FROM (old_json -> f) THEN
        fields := array_append(fields, f);
        oldv := oldv || jsonb_build_object(f, old_json -> f);
        newv := newv || jsonb_build_object(f, new_json -> f);
      END IF;
    END LOOP;
    IF array_length(fields, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.manifest_audit_log (pilgrim_id, departure_id, travel_id, booking_id, pilgrim_name, action, old_approval_status, new_approval_status, rejection_reason, changed_fields, old_values, new_values, changed_by)
  VALUES (NEW.id, NEW.departure_id, NEW.travel_id, NEW.booking_id, NEW.full_name, act, OLD.approval_status, NEW.approval_status, NEW.rejection_reason, fields,
          CASE WHEN oldv = '{}'::jsonb THEN NULL ELSE oldv END,
          CASE WHEN newv = '{}'::jsonb THEN NULL ELSE newv END,
          auth.uid());

  RETURN NEW;
END;
$$;