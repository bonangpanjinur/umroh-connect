-- 1. Allow jamaah to update own manifest row while not approved
CREATE POLICY "Jamaah can update own pending manifest"
ON public.manifest_pilgrims
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = manifest_pilgrims.booking_id AND b.user_id = auth.uid()
  )
  AND approval_status <> 'approved'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = manifest_pilgrims.booking_id AND b.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.guard_jamaah_manifest_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.owns_travel(auth.uid(), NEW.travel_id) OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-agent (jamaah) edits: protect travel-managed fields
  NEW.travel_id := OLD.travel_id;
  NEW.booking_id := OLD.booking_id;
  NEW.departure_id := OLD.departure_id;
  NEW.room_number := OLD.room_number;
  NEW.room_type := OLD.room_type;
  NEW.bus_number := OLD.bus_number;
  NEW.approved_at := OLD.approved_at;
  NEW.approved_by := OLD.approved_by;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF OLD.approval_status = 'rejected' AND NEW.approval_status = 'pending' THEN
      NEW.rejection_reason := NULL;
    ELSE
      NEW.approval_status := OLD.approval_status;
      NEW.rejection_reason := OLD.rejection_reason;
    END IF;
  ELSE
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_jamaah_manifest_update() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_guard_jamaah_manifest_update
BEFORE UPDATE ON public.manifest_pilgrims
FOR EACH ROW EXECUTE FUNCTION public.guard_jamaah_manifest_update();

-- 2. Cancellation requests
CREATE TABLE public.booking_cancellation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  penalty_percent NUMERIC NOT NULL DEFAULT 0,
  refund_estimate NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  travel_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX booking_cancellation_pending_uniq
  ON public.booking_cancellation_requests (booking_id)
  WHERE status = 'pending';
CREATE INDEX idx_cancellation_travel ON public.booking_cancellation_requests (travel_id, status);

GRANT SELECT, INSERT, UPDATE ON public.booking_cancellation_requests TO authenticated;
GRANT ALL ON public.booking_cancellation_requests TO service_role;

ALTER TABLE public.booking_cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cancellation requests"
ON public.booking_cancellation_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own cancellation requests"
ON public.booking_cancellation_requests FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND b.user_id = auth.uid()
      AND b.travel_id = booking_cancellation_requests.travel_id
      AND b.status IN ('pending', 'confirmed', 'paid')
  )
);

CREATE POLICY "Travel reviews cancellation requests"
ON public.booking_cancellation_requests FOR UPDATE TO authenticated
USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'))
WITH CHECK (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cancellation_requests_updated_at
BEFORE UPDATE ON public.booking_cancellation_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.apply_cancellation_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();

    IF NEW.status = 'approved' THEN
      UPDATE public.bookings SET status = 'cancelled', updated_at = now() WHERE id = NEW.booking_id;
    END IF;

    INSERT INTO public.agent_notifications (travel_id, notification_type, title, body, reference_id, reference_type)
    VALUES (
      NEW.travel_id, 'cancellation_decision',
      CASE WHEN NEW.status = 'approved' THEN 'Pembatalan disetujui' ELSE 'Pembatalan ditolak' END,
      'Permintaan pembatalan booking telah ' || CASE WHEN NEW.status = 'approved' THEN 'disetujui' ELSE 'ditolak' END || '.',
      NEW.booking_id, 'booking'
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_cancellation_decision() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_apply_cancellation_decision
BEFORE UPDATE ON public.booking_cancellation_requests
FOR EACH ROW EXECUTE FUNCTION public.apply_cancellation_decision();

CREATE OR REPLACE FUNCTION public.notify_new_cancellation_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_notifications (travel_id, notification_type, title, body, reference_id, reference_type)
  VALUES (NEW.travel_id, 'cancellation_request', 'Permintaan pembatalan baru',
          'Jemaah mengajukan pembatalan booking. Alasan: ' || LEFT(NEW.reason, 120),
          NEW.booking_id, 'booking');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_new_cancellation_request() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_notify_new_cancellation_request
AFTER INSERT ON public.booking_cancellation_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_new_cancellation_request();

-- 3. Itineraries
CREATE TABLE public.departure_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id UUID NOT NULL REFERENCES public.departures(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  activities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (departure_id, day_number)
);

GRANT SELECT ON public.departure_itineraries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departure_itineraries TO authenticated;
GRANT ALL ON public.departure_itineraries TO service_role;

ALTER TABLE public.departure_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view itineraries of visible departures"
ON public.departure_itineraries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.departures d
    JOIN public.packages p ON p.id = d.package_id
    WHERE d.id = departure_itineraries.departure_id AND p.is_active = true
  )
  OR owns_departure(auth.uid(), departure_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners manage itineraries"
ON public.departure_itineraries FOR ALL TO authenticated
USING (owns_departure(auth.uid(), departure_id) OR has_role(auth.uid(), 'admin'))
WITH CHECK (owns_departure(auth.uid(), departure_id) OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_departure_itineraries_updated_at
BEFORE UPDATE ON public.departure_itineraries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Journey preparation progress
CREATE TABLE public.user_journey_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_journey_progress TO authenticated;
GRANT ALL ON public.user_journey_progress TO service_role;

ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journey progress"
ON public.user_journey_progress FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Do not block cancelling/completing bookings of closed packages
CREATE OR REPLACE FUNCTION public.enforce_active_package_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg_status public.package_status;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('cancelled', 'completed') THEN
      RETURN NEW;
    END IF;
    IF NEW.package_id = OLD.package_id AND NEW.status = OLD.status THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT status INTO pkg_status FROM public.packages WHERE id = NEW.package_id;
  IF pkg_status IS NULL OR pkg_status <> 'active' THEN
    RAISE EXCEPTION 'Paket tidak menerima pendaftaran (status: %)', COALESCE(pkg_status::text, 'tidak ditemukan');
  END IF;
  RETURN NEW;
END;
$$;