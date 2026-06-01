-- Restrict platform_settings SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;

CREATE POLICY "Authenticated users can view platform settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (true);

-- Revoke anon read access on the table itself
REVOKE SELECT ON public.platform_settings FROM anon;