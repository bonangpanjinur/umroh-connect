-- Master Hotels Table
CREATE TABLE public.hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL DEFAULT 'Makkah',
  star_rating integer NOT NULL DEFAULT 4,
  distance_to_haram text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Master Airlines Table  
CREATE TABLE public.airlines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Hotels
CREATE POLICY "Anyone can view active hotels"
ON public.hotels FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage hotels"
ON public.hotels FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for Airlines
CREATE POLICY "Anyone can view active airlines"
ON public.airlines FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage airlines"
ON public.airlines FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airlines_updated_at
  BEFORE UPDATE ON public.airlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for package images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('package-images', 'package-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for package images
CREATE POLICY "Package images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'package-images');

CREATE POLICY "Authenticated users can upload package images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'package-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own package images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'package-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own package images"
ON storage.objects FOR DELETE
USING (bucket_id = 'package-images' AND auth.role() = 'authenticated');

-- Add sample master data
INSERT INTO public.hotels (name, city, star_rating, distance_to_haram) VALUES
-- Makkah Hotels
('Anjum Hotel Makkah', 'Makkah', 5, '100m'),
('Swissotel Al Maqam Makkah', 'Makkah', 5, '50m'),
('Pullman ZamZam Makkah', 'Makkah', 5, '200m'),
('Hilton Suites Makkah', 'Makkah', 5, '300m'),
('Conrad Makkah', 'Makkah', 5, '400m'),
('Le Meridien Makkah', 'Makkah', 5, '500m'),
('Makkah Towers', 'Makkah', 4, '600m'),
('Elaf Kinda Hotel', 'Makkah', 4, '800m'),
('Al Marwa Rayhaan', 'Makkah', 4, '700m'),
('Grand Zamzam Tower', 'Makkah', 4, '200m'),
-- Madinah Hotels
('Dar Al Taqwa Hotel', 'Madinah', 5, '50m'),
('Pullman ZamZam Madinah', 'Madinah', 5, '100m'),
('Anwar Al Madinah Movenpick', 'Madinah', 5, '150m'),
('Crowne Plaza Madinah', 'Madinah', 5, '200m'),
('Madinah Hilton', 'Madinah', 5, '300m'),
('Shaza Al Madina', 'Madinah', 5, '250m'),
('Dallah Taibah Hotel', 'Madinah', 4, '400m'),
('Al Haram Hotel', 'Madinah', 4, '350m'),
('Dar Al Iman Grand', 'Madinah', 4, '500m'),
('Al Eiman Royal Hotel', 'Madinah', 4, '450m');

INSERT INTO public.airlines (name, code, logo_url) VALUES
('Garuda Indonesia', 'GA', null),
('Saudi Arabian Airlines', 'SV', null),
('Emirates', 'EK', null),
('Qatar Airways', 'QR', null),
('Singapore Airlines', 'SQ', null),
('Malaysia Airlines', 'MH', null),
('Turkish Airlines', 'TK', null),
('Etihad Airways', 'EY', null),
('Lion Air', 'JT', null),
('Batik Air', 'ID', null),
('Citilink', 'QG', null),
('AirAsia', 'AK', null);