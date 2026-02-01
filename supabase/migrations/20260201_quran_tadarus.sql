-- ======================================================
-- FIXED SCHEMA: QURAN & TADARUS TRACKER
-- ======================================================

-- 1. Tabel Bookmarks (Simpan Ayat)
CREATE TABLE IF NOT EXISTS public.quran_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    surah_number INTEGER NOT NULL REFERENCES public.quran_surahs(number),
    ayah_number INTEGER NOT NULL,
    surah_name_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, surah_number, ayah_number)
);

-- 2. Tabel Terakhir Baca (Last Read)
CREATE TABLE IF NOT EXISTS public.quran_last_read (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    surah_number INTEGER NOT NULL REFERENCES public.quran_surahs(number),
    ayah_number INTEGER NOT NULL,
    surah_name_id TEXT,
    juz_number INTEGER DEFAULT 1, -- Pastikan kolom ini ada sebelum VIEW dibuat
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Pastikan kolom juz_number ada (jika tabel sudah terlanjur dibuat tanpa kolom ini)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_last_read' AND column_name='juz_number') THEN
        ALTER TABLE public.quran_last_read ADD COLUMN juz_number INTEGER DEFAULT 1;
    END IF;
END $$;

-- 3. Tabel Log Tadarus (Tracker)
CREATE TABLE IF NOT EXISTS public.quran_tadarus_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    read_date DATE DEFAULT CURRENT_DATE NOT NULL,
    surah_start INTEGER NOT NULL REFERENCES public.quran_surahs(number),
    ayah_start INTEGER NOT NULL,
    surah_end INTEGER NOT NULL REFERENCES public.quran_surahs(number),
    ayah_end INTEGER NOT NULL,
    total_verses INTEGER NOT NULL,
    juz_start INTEGER,
    juz_end INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. View Statistik Dashboard (FIXED)
-- Menggunakan subquery untuk menghindari masalah kolom yang hilang di join
CREATE OR REPLACE VIEW public.v_tadarus_dashboard AS
SELECT 
    p.user_id as user_id,
    COALESCE((SELECT SUM(total_verses) FROM public.quran_tadarus_logs WHERE user_id = p.user_id), 0) as total_ayat,
    COALESCE((SELECT COUNT(DISTINCT read_date) FROM public.quran_tadarus_logs WHERE user_id = p.user_id), 0) as hari_tadarus,
    COALESCE((SELECT juz_number FROM public.quran_last_read WHERE user_id = p.user_id LIMIT 1), 0) as progress_juz,
    COALESCE((SELECT COUNT(DISTINCT surah_start) FROM public.quran_tadarus_logs WHERE user_id = p.user_id), 0) as total_surat
FROM 
    public.profiles p;

-- RLS Policies
ALTER TABLE public.quran_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_last_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_tadarus_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors during re-run
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.quran_bookmarks;
DROP POLICY IF EXISTS "Users can manage own last read" ON public.quran_last_read;
DROP POLICY IF EXISTS "Users can manage own logs" ON public.quran_tadarus_logs;

CREATE POLICY "Users can manage own bookmarks" ON public.quran_bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own last read" ON public.quran_last_read FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own logs" ON public.quran_tadarus_logs FOR ALL USING (auth.uid() = user_id);
