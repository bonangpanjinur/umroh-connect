-- Create quran_last_read table
CREATE TABLE IF NOT EXISTS public.quran_last_read (
  user_id UUID PRIMARY KEY,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  juz_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quran_tadarus_logs table
CREATE TABLE IF NOT EXISTS public.quran_tadarus_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  read_date DATE NOT NULL DEFAULT CURRENT_DATE,
  surah_start INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  surah_end INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  total_verses INTEGER NOT NULL,
  juz_start INTEGER DEFAULT 1,
  juz_end INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quran_tadarus_logs_user_date ON public.quran_tadarus_logs(user_id, read_date);

-- Enable RLS
ALTER TABLE public.quran_last_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_tadarus_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quran_last_read
DROP POLICY IF EXISTS "Users can view own last read" ON public.quran_last_read;
CREATE POLICY "Users can view own last read" ON public.quran_last_read
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own last read" ON public.quran_last_read;
CREATE POLICY "Users can insert own last read" ON public.quran_last_read
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own last read" ON public.quran_last_read;
CREATE POLICY "Users can update own last read" ON public.quran_last_read
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for quran_tadarus_logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.quran_tadarus_logs;
CREATE POLICY "Users can view own logs" ON public.quran_tadarus_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON public.quran_tadarus_logs;
CREATE POLICY "Users can insert own logs" ON public.quran_tadarus_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logs" ON public.quran_tadarus_logs;
CREATE POLICY "Users can delete own logs" ON public.quran_tadarus_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create view for tadarus dashboard stats
DROP VIEW IF EXISTS public.v_tadarus_dashboard;
CREATE VIEW public.v_tadarus_dashboard AS
SELECT 
  user_id,
  COALESCE(SUM(total_verses), 0) AS total_ayat,
  COUNT(DISTINCT read_date) AS hari_tadarus,
  ROUND(COALESCE(SUM(total_verses), 0)::NUMERIC / 323, 1) AS progress_juz,
  COUNT(DISTINCT surah_start) AS total_surat
FROM public.quran_tadarus_logs
GROUP BY user_id;