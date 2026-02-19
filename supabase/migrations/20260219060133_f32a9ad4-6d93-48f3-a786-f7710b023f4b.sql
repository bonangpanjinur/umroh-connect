
-- Tabel quran_ayahs
CREATE TABLE public.quran_ayahs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  ayah_global INTEGER,
  arabic_text TEXT NOT NULL,
  translation_id TEXT,
  juz INTEGER,
  page INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (surah_number, ayah_number)
);

CREATE INDEX idx_quran_ayahs_surah ON public.quran_ayahs (surah_number);
CREATE INDEX idx_quran_ayahs_juz ON public.quran_ayahs (juz);

ALTER TABLE public.quran_ayahs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quran ayahs"
  ON public.quran_ayahs FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert quran ayahs"
  ON public.quran_ayahs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update quran ayahs"
  ON public.quran_ayahs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete quran ayahs"
  ON public.quran_ayahs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quran_ayahs_updated_at
  BEFORE UPDATE ON public.quran_ayahs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabel quran_sync_logs
CREATE TABLE public.quran_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL DEFAULT 'full',
  surahs_synced INTEGER DEFAULT 0,
  ayahs_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.quran_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sync logs"
  ON public.quran_sync_logs FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert sync logs"
  ON public.quran_sync_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sync logs"
  ON public.quran_sync_logs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Kolom baru di quran_surahs
ALTER TABLE public.quran_surahs
  ADD COLUMN IF NOT EXISTS revelation_type TEXT,
  ADD COLUMN IF NOT EXISTS english_name TEXT,
  ADD COLUMN IF NOT EXISTS translation_name TEXT;
