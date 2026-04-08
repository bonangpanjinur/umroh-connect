-- Create storage bucket for journal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create journals table
CREATE TABLE public.journals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  mood TEXT CHECK (mood IN ('grateful', 'peaceful', 'emotional', 'inspired', 'tired', 'happy')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal photos table
CREATE TABLE public.journal_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for journals
CREATE POLICY "Users can view own journals"
ON public.journals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journals"
ON public.journals FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create own journals"
ON public.journals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
ON public.journals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
ON public.journals FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for journal photos
CREATE POLICY "Users can view photos of accessible journals"
ON public.journal_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.journals j
    WHERE j.id = journal_id AND (j.user_id = auth.uid() OR j.is_public = true)
  )
);

CREATE POLICY "Users can add photos to own journals"
ON public.journal_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.journals j
    WHERE j.id = journal_id AND j.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete photos from own journals"
ON public.journal_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.journals j
    WHERE j.id = journal_id AND j.user_id = auth.uid()
  )
);

-- Storage policies for journal photos
CREATE POLICY "Anyone can view journal photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-photos');

CREATE POLICY "Authenticated users can upload journal photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'journal-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own journal photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own journal photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_journals_updated_at
BEFORE UPDATE ON public.journals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();