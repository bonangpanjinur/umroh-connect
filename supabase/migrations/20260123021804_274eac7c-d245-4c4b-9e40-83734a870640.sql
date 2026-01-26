-- Fix overly permissive RLS policy for payment_notification_logs
DROP POLICY IF EXISTS "System can create notification logs" ON public.payment_notification_logs;

-- Create more restrictive policy - only allow inserts for the user's own notifications or by agents/admins
CREATE POLICY "Users and agents can create notification logs"
  ON public.payment_notification_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Also fix package_inquiries if it has the same issue (from previous setup)
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.package_inquiries;

CREATE POLICY "Authenticated users can create inquiries"
  ON public.package_inquiries FOR INSERT
  WITH CHECK (
    -- Allow both authenticated and unauthenticated users, but unauthenticated must not set user_id
    (auth.uid() IS NULL AND user_id IS NULL) 
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );