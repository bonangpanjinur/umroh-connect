-- Create geofences table for safe zones
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 500,
  zone_type TEXT NOT NULL DEFAULT 'hotel', -- hotel, masjid, custom
  group_id UUID REFERENCES public.tracking_groups(id) ON DELETE CASCADE,
  travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geofence alerts table
CREATE TABLE public.geofence_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'exit', -- exit, enter
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distance_from_center DOUBLE PRECISION,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for geofences
CREATE POLICY "Users can view geofences for their groups" ON public.geofences
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_locations WHERE user_id = auth.uid())
    OR created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Group creators and agents can create geofences" ON public.geofences
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'agent')
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Creators can update their geofences" ON public.geofences
  FOR UPDATE USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'agent')
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Creators can delete their geofences" ON public.geofences
  FOR DELETE USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- RLS policies for geofence alerts
CREATE POLICY "Users can view alerts for their groups" ON public.geofence_alerts
  FOR SELECT USING (
    user_id = auth.uid()
    OR geofence_id IN (SELECT id FROM public.geofences WHERE created_by = auth.uid())
    OR has_role(auth.uid(), 'agent')
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can create alerts" ON public.geofence_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Agents can acknowledge alerts" ON public.geofence_alerts
  FOR UPDATE USING (
    has_role(auth.uid(), 'agent')
    OR has_role(auth.uid(), 'admin')
    OR geofence_id IN (SELECT id FROM public.geofences WHERE created_by = auth.uid())
  );

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;

-- Add indexes for performance
CREATE INDEX idx_geofences_group_id ON public.geofences(group_id);
CREATE INDEX idx_geofence_alerts_geofence_id ON public.geofence_alerts(geofence_id);
CREATE INDEX idx_geofence_alerts_user_id ON public.geofence_alerts(user_id);
CREATE INDEX idx_geofence_alerts_created_at ON public.geofence_alerts(created_at DESC);