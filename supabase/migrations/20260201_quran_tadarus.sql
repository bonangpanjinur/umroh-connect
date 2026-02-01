-- ======================================================
-- FINAL SCHEMA: QURAN & TADARUS TRACKER
-- ======================================================

-- 1. Tabel Bookmarks (Simpan Ayat)
CREATE TABLE IF NOT EXISTS public.quran_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    surah_name_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, surah_number, ayah_number)
);

-- 2. Tabel Terakhir Baca (Last Read)
-- Digunakan sebagai titik awal saat user klik "Tambah" di dashboard
CREATE TABLE IF NOT EXISTS public.quran_last_read (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    surah_name_id TEXT,
    juz_number INTEGER,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Tabel Log Tadarus (Tracker)
-- Mencatat aktivitas harian untuk dashboard
CREATE TABLE IF NOT EXISTS public.quran_tadarus_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_date DATE DEFAULT CURRENT_DATE NOT NULL,
    surah_start INTEGER NOT NULL,
    ayah_start INTEGER NOT NULL,
    surah_end INTEGER NOT NULL,
    ayah_end INTEGER NOT NULL,
    total_verses INTEGER NOT NULL, -- Jumlah ayat yang dibaca di sesi tersebut
    juz_start INTEGER,
    juz_end INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. View Statistik Dashboard
-- Query ini yang akan dipanggil oleh Tab Tadarus
CREATE OR REPLACE VIEW public.v_tadarus_dashboard AS
SELECT 
    p.id as user_id,
    COALESCE(SUM(l.total_verses), 0) as total_ayat,
    COUNT(DISTINCT l.read_date) as hari_tadarus,
    COALESCE(MAX(lr.juz_number), 0) as progress_juz,
    -- Menghitung jumlah surat unik yang sudah pernah dibaca
    COUNT(DISTINCT l.surah_start) as total_surat
FROM 
    public.profiles p
LEFT JOIN public.quran_tadarus_logs l ON p.id = l.user_id
LEFT JOIN public.quran_last_read lr ON p.id = lr.user_id
GROUP BY 
    p.id, lr.juz_number;

-- RLS Policies
ALTER TABLE public.quran_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_last_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_tadarus_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks" ON public.quran_bookmarks FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = quran_bookmarks.user_id));
CREATE POLICY "Users can manage own last read" ON public.quran_last_read FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = quran_last_read.user_id));
CREATE POLICY "Users can manage own logs" ON public.quran_tadarus_logs FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = quran_tadarus_logs.user_id));
