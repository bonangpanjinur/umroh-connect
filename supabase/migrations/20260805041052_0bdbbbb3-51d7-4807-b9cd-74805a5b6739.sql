CREATE TABLE public.manifest_pilgrims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  departure_id UUID REFERENCES public.departures(id) ON DELETE SET NULL,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'L',
  birth_date DATE,
  nik TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  phone TEXT,
  mahram_name TEXT,
  room_type TEXT NOT NULL DEFAULT 'quad',
  room_number TEXT,
  bus_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manifest_pilgrims TO authenticated;
GRANT ALL ON public.manifest_pilgrims TO service_role;

ALTER TABLE public.manifest_pilgrims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage manifest of own travel"
ON public.manifest_pilgrims FOR ALL TO authenticated
USING (public.owns_travel(auth.uid(), travel_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.owns_travel(auth.uid(), travel_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Jamaah can view own manifest"
ON public.manifest_pilgrims FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bookings b
  WHERE b.id = manifest_pilgrims.booking_id AND b.user_id = auth.uid()
));

CREATE INDEX idx_manifest_pilgrims_departure ON public.manifest_pilgrims(departure_id);
CREATE INDEX idx_manifest_pilgrims_travel ON public.manifest_pilgrims(travel_id);
CREATE INDEX idx_manifest_pilgrims_booking ON public.manifest_pilgrims(booking_id);

CREATE TRIGGER update_manifest_pilgrims_updated_at
BEFORE UPDATE ON public.manifest_pilgrims
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();