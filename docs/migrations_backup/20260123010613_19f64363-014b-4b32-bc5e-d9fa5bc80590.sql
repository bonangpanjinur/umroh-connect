-- Create table for tracking package interests/inquiries
CREATE TABLE public.package_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  departure_id UUID REFERENCES public.departures(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interest_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'whatsapp_click', 'inquiry'
  session_id TEXT, -- For anonymous tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_interests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert interests (including anonymous users)
CREATE POLICY "Anyone can create interests"
ON public.package_interests
FOR INSERT
WITH CHECK (true);

-- Agents can view interests for their own packages
CREATE POLICY "Agents can view own package interests"
ON public.package_interests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.packages pkg
    JOIN public.travels t ON pkg.travel_id = t.id
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE pkg.id = package_interests.package_id AND p.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for faster queries
CREATE INDEX idx_package_interests_package_id ON public.package_interests(package_id);
CREATE INDEX idx_package_interests_created_at ON public.package_interests(created_at);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.package_interests;