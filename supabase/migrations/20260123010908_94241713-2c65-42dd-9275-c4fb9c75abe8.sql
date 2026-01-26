-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create interests" ON public.package_interests;

-- Create more secure insert policy that still allows anonymous tracking
-- but validates that the package_id must exist and be active
CREATE POLICY "Anyone can create valid interests"
ON public.package_interests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.packages p
    WHERE p.id = package_id AND p.is_active = true
  )
);