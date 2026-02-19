
-- Fix Security Definer View: v_tadarus_dashboard
-- Change to SECURITY INVOKER so RLS is respected
DROP VIEW IF EXISTS public.v_tadarus_dashboard;
CREATE VIEW public.v_tadarus_dashboard WITH (security_invoker = true) AS
SELECT user_id,
    COALESCE(sum(total_verses), 0::bigint) AS total_ayat,
    count(DISTINCT read_date) AS hari_tadarus,
    round((COALESCE(sum(total_verses), 0::bigint))::numeric / 323::numeric, 1) AS progress_juz,
    count(DISTINCT surah_start) AS total_surat
FROM quran_tadarus_logs
GROUP BY user_id;

-- Fix RLS: agent_notifications INSERT policy is too permissive
-- This table is written by edge functions using service_role, so restrict direct inserts
DROP POLICY IF EXISTS "System can create notifications" ON public.agent_notifications;
CREATE POLICY "Service role creates notifications" ON public.agent_notifications
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.owns_travel(auth.uid(), travel_id)
  );
