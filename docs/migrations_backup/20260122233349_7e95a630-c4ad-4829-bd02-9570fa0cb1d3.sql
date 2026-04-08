-- Add status column to travels for suspension
ALTER TABLE public.travels 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add approval status to profiles for agent verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspension_reason text;
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Add approval tracking to travels
ALTER TABLE public.travels
ADD COLUMN IF NOT EXISTS approval_notes text;
ALTER TABLE public.travels
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;
ALTER TABLE public.travels
ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Create agent_applications table for tracking agent registration requests
CREATE TABLE IF NOT EXISTS public.agent_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  travel_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  address text,
  description text,
  documents text[],
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on agent_applications
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_applications
CREATE POLICY "Users can view own applications"
ON public.agent_applications FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create applications"
ON public.agent_applications FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all applications"
ON public.agent_applications FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_agent_applications_updated_at
  BEFORE UPDATE ON public.agent_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update packages view policy to respect travel status
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (
  (is_active = true AND EXISTS (
    SELECT 1 FROM travels t WHERE t.id = packages.travel_id AND t.status = 'active' AND t.verified = true
  )) 
  OR owns_package(auth.uid(), id) 
  OR has_role(auth.uid(), 'admin')
);