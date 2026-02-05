-- Add foreign key columns to packages table
ALTER TABLE public.packages 
ADD COLUMN hotel_makkah_id uuid REFERENCES public.hotels(id),
ADD COLUMN hotel_madinah_id uuid REFERENCES public.hotels(id),
ADD COLUMN airline_id uuid REFERENCES public.airlines(id);

-- Add comments for clarity
COMMENT ON COLUMN public.packages.hotel_makkah_id IS 'Reference to master hotel in Makkah';
COMMENT ON COLUMN public.packages.hotel_madinah_id IS 'Reference to master hotel in Madinah';
COMMENT ON COLUMN public.packages.airline_id IS 'Reference to master airline';
