
-- 1. Trigger on packages: cascade close to departures + emit notification
CREATE OR REPLACE FUNCTION public.handle_package_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg_travel_id UUID;
  notif_title TEXT;
  notif_body TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Cascade: close all departures when package closed
    IF NEW.status = 'closed' THEN
      UPDATE public.departures
        SET status = 'cancelled', updated_at = now()
        WHERE package_id = NEW.id AND status <> 'cancelled';
    END IF;

    -- Notify agent on transitions to active or closed
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
$$;

DROP TRIGGER IF EXISTS trg_package_status_change ON public.packages;
CREATE TRIGGER trg_package_status_change
AFTER UPDATE OF status ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.handle_package_status_change();

-- 2. Block bookings on non-active packages
CREATE OR REPLACE FUNCTION public.enforce_active_package_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg_status public.package_status;
BEGIN
  SELECT status INTO pkg_status FROM public.packages WHERE id = NEW.package_id;
  IF pkg_status IS NULL OR pkg_status <> 'active' THEN
    RAISE EXCEPTION 'Paket tidak menerima pendaftaran (status: %)', COALESCE(pkg_status::text, 'tidak ditemukan');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_active_package_on_booking ON public.bookings;
CREATE TRIGGER trg_enforce_active_package_on_booking
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_active_package_on_booking();

-- 3. Index for status filtering
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages (status);
