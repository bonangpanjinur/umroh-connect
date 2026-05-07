
ALTER TABLE public.departures
  ADD COLUMN IF NOT EXISTS last_low_seats_threshold TEXT;

CREATE OR REPLACE FUNCTION public.notify_departure_low_seats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pkg RECORD;
  occupancy_pct NUMERIC;
  notif_title TEXT;
  notif_body TEXT;
  new_threshold TEXT := NULL;
BEGIN
  IF NEW.total_seats IS NULL OR NEW.total_seats = 0 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.available_seats = OLD.available_seats
    AND NEW.status = OLD.status
    AND NEW.total_seats = OLD.total_seats THEN
    RETURN NEW;
  END IF;

  occupancy_pct := ((NEW.total_seats - NEW.available_seats)::NUMERIC / NEW.total_seats) * 100;

  IF NEW.status = 'cancelled' THEN
    NEW.last_low_seats_threshold := NULL;
    RETURN NEW;
  END IF;

  IF occupancy_pct >= 90 THEN
    new_threshold := 'near_full';
  ELSIF occupancy_pct >= 70 THEN
    new_threshold := 'limited';
  ELSE
    new_threshold := NULL;
  END IF;

  IF new_threshold IS NULL THEN
    NEW.last_low_seats_threshold := NULL;
    RETURN NEW;
  END IF;

  IF NEW.last_low_seats_threshold IS DISTINCT FROM new_threshold
     AND (
       NEW.last_low_seats_threshold IS NULL
       OR (NEW.last_low_seats_threshold = 'limited' AND new_threshold = 'near_full')
     ) THEN
    SELECT p.name, p.travel_id INTO pkg FROM public.packages p WHERE p.id = NEW.package_id;

    IF new_threshold = 'near_full' THEN
      notif_title := '⚠️ Jadwal hampir penuh';
      notif_body := 'Paket "' || pkg.name || '" — keberangkatan ' ||
        to_char(NEW.departure_date, 'DD Mon YYYY') ||
        ' tinggal ' || NEW.available_seats || '/' || NEW.total_seats || ' seat (' ||
        ROUND(occupancy_pct) || '% terisi).';
    ELSE
      notif_title := 'Ketersediaan terbatas';
      notif_body := 'Paket "' || pkg.name || '" — keberangkatan ' ||
        to_char(NEW.departure_date, 'DD Mon YYYY') ||
        ' tersisa ' || NEW.available_seats || '/' || NEW.total_seats || ' seat (' ||
        ROUND(occupancy_pct) || '% terisi).';
    END IF;

    INSERT INTO public.agent_notifications (travel_id, notification_type, title, body, reference_id, reference_type)
    VALUES (pkg.travel_id, 'departure_low_seats', notif_title, notif_body, NEW.id, 'departure');
  END IF;

  NEW.last_low_seats_threshold := new_threshold;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_departure_low_seats ON public.departures;
CREATE TRIGGER trg_notify_departure_low_seats
BEFORE INSERT OR UPDATE ON public.departures
FOR EACH ROW EXECUTE FUNCTION public.notify_departure_low_seats();

DROP TRIGGER IF EXISTS trg_enforce_active_package_on_booking_upd ON public.bookings;
CREATE TRIGGER trg_enforce_active_package_on_booking_upd
BEFORE UPDATE OF package_id, number_of_pilgrims, status ON public.bookings
FOR EACH ROW
WHEN (NEW.status NOT IN ('cancelled', 'refunded'))
EXECUTE FUNCTION public.enforce_active_package_on_booking();

CREATE OR REPLACE FUNCTION public.handle_package_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pkg_travel_id UUID;
  notif_title TEXT;
  notif_body TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'closed' THEN
      UPDATE public.departures
        SET status = 'cancelled', updated_at = now()
        WHERE package_id = NEW.id AND status <> 'cancelled';
    ELSIF NEW.status = 'active' AND OLD.status = 'closed' THEN
      UPDATE public.departures
        SET status = CASE
              WHEN available_seats = 0 THEN 'full'::public.departure_status
              WHEN available_seats::NUMERIC / NULLIF(total_seats,0) <= 0.3 THEN 'limited'::public.departure_status
              ELSE 'available'::public.departure_status
            END,
            updated_at = now()
        WHERE package_id = NEW.id
          AND status = 'cancelled'
          AND departure_date >= CURRENT_DATE;
    END IF;

    IF NEW.status IN ('active', 'closed') THEN
      pkg_travel_id := NEW.travel_id;
      IF NEW.status = 'active' THEN
        notif_title := 'Paket dipublikasikan';
        notif_body := 'Paket "' || NEW.name || '" sekarang tampil di publik dan menerima pendaftaran.';
      ELSE
        notif_title := 'Paket ditutup';
        notif_body := 'Paket "' || NEW.name || '" telah ditutup. Semua jadwal keberangkatan dibatalkan.';
      END IF;

      INSERT INTO public.agent_notifications (travel_id, notification_type, title, body, reference_id, reference_type)
      VALUES (pkg_travel_id, 'package_status_change', notif_title, notif_body, NEW.id, 'package');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE INDEX IF NOT EXISTS idx_departure_audit_log_pkg_created
  ON public.departure_audit_log (package_id, created_at DESC);
