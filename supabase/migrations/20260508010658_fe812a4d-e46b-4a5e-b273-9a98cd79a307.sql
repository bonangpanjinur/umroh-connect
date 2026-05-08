-- Standalone helper to restore cancelled future departures of a package.
-- Useful for a manual "Restore jadwal" button in the agent UI.
CREATE OR REPLACE FUNCTION public.restore_package_departures(_package_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected INTEGER := 0;
BEGIN
  -- Authorization: only the package owner or an admin may restore.
  IF NOT (public.owns_package(auth.uid(), _package_id) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Tidak diizinkan memulihkan jadwal paket ini';
  END IF;

  UPDATE public.departures
    SET status = CASE
          WHEN available_seats = 0 THEN 'full'::public.departure_status
          WHEN available_seats::NUMERIC / NULLIF(total_seats, 0) <= 0.3 THEN 'limited'::public.departure_status
          ELSE 'available'::public.departure_status
        END,
        last_low_seats_threshold = NULL,
        updated_at = now()
    WHERE package_id = _package_id
      AND status = 'cancelled'
      AND departure_date >= CURRENT_DATE;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_package_departures(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.restore_package_departures(uuid) TO authenticated;