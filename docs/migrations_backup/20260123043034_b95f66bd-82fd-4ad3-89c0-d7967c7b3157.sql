-- Fix overly permissive INSERT policy for geofence_alerts
-- Drop the old policy and create a more restrictive one
DROP POLICY IF EXISTS "System can create alerts" ON public.geofence_alerts;

CREATE POLICY "Authenticated users can create alerts" ON public.geofence_alerts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );