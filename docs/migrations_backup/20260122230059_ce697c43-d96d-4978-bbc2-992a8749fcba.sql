-- Drop existing INSERT policy for travels
DROP POLICY IF EXISTS "Agents can create travel" ON public.travels;

-- Create new INSERT policy that allows both agents and admins
CREATE POLICY "Agents and admins can create travel" 
ON public.travels 
FOR INSERT 
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'agent'::app_role) AND (owner_id = get_profile_id(auth.uid())))
  OR has_role(auth.uid(), 'admin'::app_role)
);