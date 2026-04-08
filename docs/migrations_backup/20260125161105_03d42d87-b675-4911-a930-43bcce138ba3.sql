-- Add audio_url column to manasik_guides table for doa audio files
ALTER TABLE public.manasik_guides
ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT NULL;

-- Add doa_arabic column for the prayer text
ALTER TABLE public.manasik_guides
ADD COLUMN IF NOT EXISTS doa_arabic TEXT DEFAULT NULL;

-- Add doa_latin (transliteration) column
ALTER TABLE public.manasik_guides
ADD COLUMN IF NOT EXISTS doa_latin TEXT DEFAULT NULL;

-- Add doa_meaning (translation) column  
ALTER TABLE public.manasik_guides
ADD COLUMN IF NOT EXISTS doa_meaning TEXT DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.manasik_guides.audio_url IS 'URL to audio file for doa recitation stored in Supabase Storage';
COMMENT ON COLUMN public.manasik_guides.doa_arabic IS 'Arabic text of the doa/prayer';
COMMENT ON COLUMN public.manasik_guides.doa_latin IS 'Latin transliteration of the doa';
COMMENT ON COLUMN public.manasik_guides.doa_meaning IS 'Indonesian translation/meaning of the doa';