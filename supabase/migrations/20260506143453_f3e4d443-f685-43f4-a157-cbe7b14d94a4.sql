-- Audit log for departure changes
CREATE TABLE IF NOT EXISTS public.departure_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id UUID NOT NULL REFERENCES public.departures(id) ON DELETE CASCADE,
  package_id UUID NOT NULL,
  travel_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'status' | 'seats' | 'created' | 'price' | 'mixed'
  old_status TEXT,
  new_status TEXT,
  old_total_seats INTEGER,
  new_total_seats INTEGER,
  old_available_seats INTEGER,
  new_available_seats INTEGER,
  old_price NUMERIC,
  new_price NUMERIC,
  changed_by UUID,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_departure_audit_departure ON public.departure_audit_log(departure_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_departure_audit_package ON public.departure_audit_log(package_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_departure_audit_travel ON public.departure_audit_log(travel_id, created_at DESC);

ALTER TABLE public.departure_audit_log ENABLE ROW LEVEL SECURITY;

-- Owner agent can read their own travel audit logs
CREATE POLICY "Agents read own departure audit"
ON public.departure_audit_log FOR SELECT
TO authenticated
USING (public.owns_travel(auth.uid(), travel_id) OR public.has_role(auth.uid(), 'admin'));

-- Only system (trigger via SECURITY DEFINER) inserts; block direct writes
CREATE POLICY "No direct insert audit"
ON public.departure_audit_log FOR INSERT
TO authenticated
WITH CHECK (false);

-- Trigger function: log departure changes
CREATE OR REPLACE FUNCTION public.log_departure_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg_travel_id UUID;
  ctype TEXT;
  status_changed BOOLEAN := false;
  seats_changed BOOLEAN := false;
  price_changed BOOLEAN := false;
BEGIN
  SELECT travel_id INTO pkg_travel_id FROM public.packages WHERE id = NEW.package_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.departure_audit_log (
      departure_id, package_id, travel_id, change_type,
      new_status, new_total_seats, new_available_seats, new_price, changed_by
    ) VALUES (
      NEW.id, NEW.package_id, pkg_travel_id, 'created',
      NEW.status::text, NEW.total_seats, NEW.available_seats, NEW.price, auth.uid()
    );
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN status_changed := true; END IF;
  IF NEW.total_seats IS DISTINCT FROM OLD.total_seats OR NEW.available_seats IS DISTINCT FROM OLD.available_seats THEN seats_changed := true; END IF;
  IF NEW.price IS DISTINCT FROM OLD.price THEN price_changed := true; END IF;

  IF NOT (status_changed OR seats_changed OR price_changed) THEN
    RETURN NEW;
  END IF;

  IF status_changed AND seats_changed THEN ctype := 'mixed';
  ELSIF status_changed THEN ctype := 'status';
  ELSIF seats_changed THEN ctype := 'seats';
  ELSIF price_changed THEN ctype := 'price';
  ELSE ctype := 'mixed';
  END IF;

  INSERT INTO public.departure_audit_log (
    departure_id, package_id, travel_id, change_type,
    old_status, new_status,
    old_total_seats, new_total_seats,
    old_available_seats, new_available_seats,
    old_price, new_price, changed_by
  ) VALUES (
    NEW.id, NEW.package_id, pkg_travel_id, ctype,
    OLD.status::text, NEW.status::text,
    OLD.total_seats, NEW.total_seats,
    OLD.available_seats, NEW.available_seats,
    OLD.price, NEW.price, auth.uid()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_departure_change ON public.departures;
CREATE TRIGGER trg_log_departure_change
AFTER INSERT OR UPDATE ON public.departures
FOR EACH ROW EXECUTE FUNCTION public.log_departure_change();