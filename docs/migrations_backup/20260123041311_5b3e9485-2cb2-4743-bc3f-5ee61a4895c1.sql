-- Create table for group tracking
CREATE TABLE public.tracking_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for group members and their locations
CREATE TABLE public.group_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.tracking_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  battery_level INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_sharing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for user per group
CREATE UNIQUE INDEX idx_group_locations_user_group ON public.group_locations(group_id, user_id);

-- Enable RLS
ALTER TABLE public.tracking_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for tracking_groups
CREATE POLICY "Users can view groups they created or are members of"
ON public.tracking_groups FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.group_locations gl 
    WHERE gl.group_id = id AND gl.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups"
ON public.tracking_groups FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their groups"
ON public.tracking_groups FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their groups"
ON public.tracking_groups FOR DELETE
USING (created_by = auth.uid());

-- RLS policies for group_locations
CREATE POLICY "Group members can view all locations in their group"
ON public.group_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_locations gl 
    WHERE gl.group_id = group_id AND gl.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.tracking_groups tg 
    WHERE tg.id = group_id AND tg.created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert their own location"
ON public.group_locations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own location"
ON public.group_locations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own location"
ON public.group_locations FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for group_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_locations;

-- Create function to generate group code
CREATE OR REPLACE FUNCTION public.generate_group_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    new_code := upper(substr(md5(random()::text), 1, 6));
    
    SELECT EXISTS (SELECT 1 FROM public.tracking_groups WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger to auto-generate group code
CREATE OR REPLACE FUNCTION public.set_group_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_group_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_tracking_group_code
  BEFORE INSERT ON public.tracking_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_group_code();