-- Create package_inquiries table for lead management
CREATE TABLE public.package_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  departure_id UUID REFERENCES public.departures(id) ON DELETE SET NULL,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  user_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  number_of_people INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  agent_notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can create inquiries (logged in or not)
CREATE POLICY "Anyone can create inquiries"
ON public.package_inquiries
FOR INSERT
WITH CHECK (true);

-- Users can view their own inquiries
CREATE POLICY "Users can view own inquiries"
ON public.package_inquiries
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  owns_travel(auth.uid(), travel_id) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Agents can update their inquiries
CREATE POLICY "Agents can update inquiries"
ON public.package_inquiries
FOR UPDATE
USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Agents can delete their inquiries
CREATE POLICY "Agents can delete inquiries"
ON public.package_inquiries
FOR DELETE
USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_package_inquiries_updated_at
BEFORE UPDATE ON public.package_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_inquiries_travel_id ON public.package_inquiries(travel_id);
CREATE INDEX idx_inquiries_status ON public.package_inquiries(status);
CREATE INDEX idx_inquiries_created_at ON public.package_inquiries(created_at DESC);