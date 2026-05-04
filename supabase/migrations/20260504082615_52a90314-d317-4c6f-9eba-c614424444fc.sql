-- 1) Trigger: notify agent when departure availability hits limited/near-full
CREATE OR REPLACE FUNCTION public.notify_departure_low_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg RECORD;
  occupancy_pct NUMERIC;
  old_pct NUMERIC;
  notif_title TEXT;
  notif_body TEXT;
  threshold_crossed TEXT := NULL;
BEGIN
  IF NEW.total_seats IS NULL OR NEW.total_seats = 0 THEN
    RETURN NEW;
  END IF;

  -- Only run on availability change (or first insert)
  IF TG_OP = 'UPDATE' AND NEW.available_seats = OLD.available_seats AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  occupancy_pct := ((NEW.total_seats - NEW.available_seats)::NUMERIC / NEW.total_seats) * 100;

  IF TG_OP = 'UPDATE' AND OLD.total_seats > 0 THEN
    old_pct := ((OLD.total_seats - OLD.available_seats)::NUMERIC / OLD.total_seats) * 100;
  ELSE
    old_pct := 0;
  END IF;

  -- Determine threshold crossing
  IF NEW.status <> 'cancelled' THEN
    IF occupancy_pct >= 90 AND old_pct < 90 THEN
      threshold_crossed := 'near_full';
    ELSIF occupancy_pct >= 70 AND old_pct < 70 THEN
      threshold_crossed := 'limited';
    END IF;
  END IF;

  IF threshold_crossed IS NOT NULL THEN
    SELECT p.name, p.travel_id INTO pkg
    FROM public.packages p WHERE p.id = NEW.package_id;

    IF threshold_crossed = 'near_full' THEN
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_departure_low_seats ON public.departures;
CREATE TRIGGER trg_notify_departure_low_seats
AFTER INSERT OR UPDATE OF available_seats, total_seats, status
ON public.departures
FOR EACH ROW
EXECUTE FUNCTION public.notify_departure_low_seats();

-- 2) Enable realtime on departures
ALTER TABLE public.departures REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.departures;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;