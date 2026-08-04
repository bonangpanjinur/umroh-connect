-- departures.status is TEXT with a CHECK constraint, not an enum.
-- The previous versions cast to a non-existent type public.departure_status,
-- which made reopening a closed package fail at runtime.

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
              WHEN available_seats = 0 THEN 'full'
              WHEN available_seats::NUMERIC / NULLIF(total_seats,0) <= 0.3 THEN 'limited'
              ELSE 'available'
            END,
            last_low_seats_threshold = NULL,
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

CREATE OR REPLACE FUNCTION public.restore_package_departures(_package_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected INTEGER := 0;
BEGIN
  IF NOT (public.owns_package(auth.uid(), _package_id) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Tidak diizinkan memulihkan jadwal paket ini';
  END IF;

  UPDATE public.departures
    SET status = CASE
          WHEN available_seats = 0 THEN 'full'
          WHEN available_seats::NUMERIC / NULLIF(total_seats, 0) <= 0.3 THEN 'limited'
          ELSE 'available'
        END,
        last_low_seats_threshold = NULL,
        updated_at = now()
    WHERE package_id = _package_id
      AND status = 'cancelled'
      AND departure_date >= CURRENT_DATE;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;