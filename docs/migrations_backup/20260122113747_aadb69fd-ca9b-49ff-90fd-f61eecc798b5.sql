-- Allow authenticated users to insert their own roles (for self-registration as agent)
CREATE POLICY "Users can request agent role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'agent');

-- Update trigger to also add user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'jamaah');
  
  -- Also add to user_roles for RLS checks
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'jamaah');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;