-- ==========================================
-- COMPLETE QURAN & TADARUS SETUP
-- Jalankan SEKALI di SQL Editor Supabase
-- ==========================================

-- ==========================================
-- 1. DROP EXISTING OBJECTS (Clean State)
-- ==========================================

-- Drop view first (depends on table)
DROP VIEW IF EXISTS public.v_tadarus_dashboard;

-- Drop policies on quran_surahs
DROP POLICY IF EXISTS "Anyone can view surahs" ON public.quran_surahs;

-- Drop policies on quran_last_read
DROP POLICY IF EXISTS "Users can view own last read" ON public.quran_last_read;
DROP POLICY IF EXISTS "Users can insert own last read" ON public.quran_last_read;
DROP POLICY IF EXISTS "Users can update own last read" ON public.quran_last_read;

-- Drop policies on quran_tadarus_logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.quran_tadarus_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.quran_tadarus_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.quran_tadarus_logs;

-- Drop policies on static_pages
DROP POLICY IF EXISTS "Anyone can view active pages" ON public.static_pages;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.static_pages;

-- Drop existing tables (order matters due to FK)
DROP TABLE IF EXISTS public.quran_tadarus_logs;
DROP TABLE IF EXISTS public.quran_last_read;
DROP TABLE IF EXISTS public.quran_surahs;
DROP TABLE IF EXISTS public.static_pages;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

-- Table: quran_surahs (Master data 114 surat)
CREATE TABLE public.quran_surahs (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_arabic TEXT NOT NULL,
    total_verses INTEGER NOT NULL,
    juz_start INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table: quran_last_read (Posisi terakhir baca user)
CREATE TABLE public.quran_last_read (
    user_id UUID PRIMARY KEY,
    surah_number INTEGER NOT NULL DEFAULT 1,
    ayah_number INTEGER NOT NULL DEFAULT 1,
    juz_number INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table: quran_tadarus_logs (Log harian bacaan)
CREATE TABLE public.quran_tadarus_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    read_date DATE NOT NULL DEFAULT CURRENT_DATE,
    surah_start INTEGER NOT NULL,
    ayah_start INTEGER NOT NULL DEFAULT 1,
    surah_end INTEGER NOT NULL,
    ayah_end INTEGER NOT NULL,
    total_verses INTEGER NOT NULL DEFAULT 0,
    juz_start INTEGER DEFAULT 1,
    juz_end INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table: static_pages (Halaman statis/info)
CREATE TABLE public.static_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- 3. CREATE INDEXES
-- ==========================================

CREATE INDEX idx_quran_tadarus_logs_user_date ON public.quran_tadarus_logs(user_id, read_date);
CREATE INDEX idx_quran_tadarus_logs_surah ON public.quran_tadarus_logs(surah_start);
CREATE INDEX idx_static_pages_slug ON public.static_pages(slug);

-- ==========================================
-- 4. CREATE VIEW FOR DASHBOARD STATS
-- ==========================================

CREATE OR REPLACE VIEW public.v_tadarus_dashboard AS
SELECT 
    user_id,
    COALESCE(SUM(total_verses), 0) AS total_ayat,
    COUNT(DISTINCT read_date) AS hari_tadarus,
    ROUND(COALESCE(SUM(total_verses), 0)::numeric / 6236 * 30, 1) AS progress_juz,
    COUNT(DISTINCT surah_start) AS total_surat
FROM public.quran_tadarus_logs
GROUP BY user_id;

-- ==========================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.quran_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_last_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_tadarus_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. CREATE RLS POLICIES
-- ==========================================

-- Policies for quran_surahs (public read)
CREATE POLICY "Anyone can view surahs" ON public.quran_surahs
    FOR SELECT USING (true);

-- Policies for quran_last_read
CREATE POLICY "Users can view own last read" ON public.quran_last_read
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own last read" ON public.quran_last_read
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own last read" ON public.quran_last_read
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for quran_tadarus_logs
CREATE POLICY "Users can view own logs" ON public.quran_tadarus_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.quran_tadarus_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.quran_tadarus_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for static_pages
CREATE POLICY "Anyone can view active pages" ON public.static_pages
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pages" ON public.static_pages
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- 7. CREATE TRIGGER FOR updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_static_pages_updated_at ON public.static_pages;
CREATE TRIGGER update_static_pages_updated_at
    BEFORE UPDATE ON public.static_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 8. INSERT QURAN SURAHS DATA (114 Surat)
-- ==========================================

INSERT INTO public.quran_surahs (number, name, name_arabic, total_verses, juz_start) VALUES
(1, 'Al-Fatihah', 'الفاتحة', 7, 1),
(2, 'Al-Baqarah', 'البقرة', 286, 1),
(3, 'Ali ''Imran', 'آل عمران', 200, 3),
(4, 'An-Nisa''', 'النساء', 176, 4),
(5, 'Al-Ma''idah', 'المائدة', 120, 6),
(6, 'Al-An''am', 'الأنعام', 165, 7),
(7, 'Al-A''raf', 'الأعراف', 206, 8),
(8, 'Al-Anfal', 'الأنفال', 75, 9),
(9, 'At-Taubah', 'التوبة', 129, 10),
(10, 'Yunus', 'يونس', 109, 11),
(11, 'Hud', 'هود', 123, 11),
(12, 'Yusuf', 'يوسف', 111, 12),
(13, 'Ar-Ra''d', 'الرعد', 43, 13),
(14, 'Ibrahim', 'إبراهيم', 52, 13),
(15, 'Al-Hijr', 'الحجر', 99, 14),
(16, 'An-Nahl', 'النحل', 128, 14),
(17, 'Al-Isra''', 'الإسراء', 111, 15),
(18, 'Al-Kahf', 'الكهف', 110, 15),
(19, 'Maryam', 'مريم', 98, 16),
(20, 'Taha', 'طه', 135, 16),
(21, 'Al-Anbiya''', 'الأنبياء', 112, 17),
(22, 'Al-Hajj', 'الحج', 78, 17),
(23, 'Al-Mu''minun', 'المؤمنون', 118, 18),
(24, 'An-Nur', 'النور', 64, 18),
(25, 'Al-Furqan', 'الفرقان', 77, 18),
(26, 'Ash-Shu''ara''', 'الشعراء', 227, 19),
(27, 'An-Naml', 'النمل', 93, 19),
(28, 'Al-Qasas', 'القصص', 88, 20),
(29, 'Al-''Ankabut', 'العنكبوت', 69, 20),
(30, 'Ar-Rum', 'الروم', 60, 21),
(31, 'Luqman', 'لقمان', 34, 21),
(32, 'As-Sajdah', 'السجدة', 30, 21),
(33, 'Al-Ahzab', 'الأحزاب', 73, 21),
(34, 'Saba''', 'سبأ', 54, 22),
(35, 'Fatir', 'فاطر', 45, 22),
(36, 'Ya-Sin', 'يس', 83, 22),
(37, 'As-Saffat', 'الصافات', 182, 23),
(38, 'Sad', 'ص', 88, 23),
(39, 'Az-Zumar', 'الزمر', 75, 23),
(40, 'Ghafir', 'غافر', 85, 24),
(41, 'Fussilat', 'فصلت', 54, 24),
(42, 'Ash-Shura', 'الشورى', 53, 25),
(43, 'Az-Zukhruf', 'الزخرف', 89, 25),
(44, 'Ad-Dukhan', 'الدخان', 59, 25),
(45, 'Al-Jathiyah', 'الجاثية', 37, 25),
(46, 'Al-Ahqaf', 'الأحقاف', 35, 26),
(47, 'Muhammad', 'محمد', 38, 26),
(48, 'Al-Fath', 'الفتح', 29, 26),
(49, 'Al-Hujurat', 'الحجرات', 18, 26),
(50, 'Qaf', 'ق', 45, 26),
(51, 'Adh-Dhariyat', 'الذاريات', 60, 26),
(52, 'At-Tur', 'الطور', 49, 27),
(53, 'An-Najm', 'النجم', 62, 27),
(54, 'Al-Qamar', 'القمر', 55, 27),
(55, 'Ar-Rahman', 'الرحمن', 78, 27),
(56, 'Al-Waqi''ah', 'الواقعة', 96, 27),
(57, 'Al-Hadid', 'الحديد', 29, 27),
(58, 'Al-Mujadila', 'المجادلة', 22, 28),
(59, 'Al-Hashr', 'الحشر', 24, 28),
(60, 'Al-Mumtahanah', 'الممتحنة', 13, 28),
(61, 'As-Saff', 'الصف', 14, 28),
(62, 'Al-Jumu''ah', 'الجمعة', 11, 28),
(63, 'Al-Munafiqun', 'المنافقون', 11, 28),
(64, 'At-Taghabun', 'التغابن', 18, 28),
(65, 'At-Talaq', 'الطلاق', 12, 28),
(66, 'At-Tahrim', 'التحريم', 12, 28),
(67, 'Al-Mulk', 'الملك', 30, 29),
(68, 'Al-Qalam', 'القلم', 52, 29),
(69, 'Al-Haqqah', 'الحاقة', 52, 29),
(70, 'Al-Ma''arij', 'المعارج', 44, 29),
(71, 'Nuh', 'نوح', 28, 29),
(72, 'Al-Jinn', 'الجن', 28, 29),
(73, 'Al-Muzzammil', 'المزمل', 20, 29),
(74, 'Al-Muddaththir', 'المدثر', 56, 29),
(75, 'Al-Qiyamah', 'القيامة', 40, 29),
(76, 'Al-Insan', 'الإنسان', 31, 29),
(77, 'Al-Mursalat', 'المرسلات', 50, 29),
(78, 'An-Naba''', 'النبأ', 40, 30),
(79, 'An-Nazi''at', 'النازعات', 46, 30),
(80, '''Abasa', 'عبس', 42, 30),
(81, 'At-Takwir', 'التكوير', 29, 30),
(82, 'Al-Infitar', 'الانفطار', 19, 30),
(83, 'Al-Mutaffifin', 'المطففين', 36, 30),
(84, 'Al-Inshiqaq', 'الانشقاق', 25, 30),
(85, 'Al-Buruj', 'البروج', 22, 30),
(86, 'At-Tariq', 'الطارق', 17, 30),
(87, 'Al-A''la', 'الأعلى', 19, 30),
(88, 'Al-Ghashiyah', 'الغاشية', 26, 30),
(89, 'Al-Fajr', 'الفجر', 30, 30),
(90, 'Al-Balad', 'البلد', 20, 30),
(91, 'Ash-Shams', 'الشمس', 15, 30),
(92, 'Al-Layl', 'الليل', 21, 30),
(93, 'Ad-Duhaa', 'الضحى', 11, 30),
(94, 'Ash-Sharh', 'الشرح', 8, 30),
(95, 'At-Tin', 'التين', 8, 30),
(96, 'Al-''Alaq', 'العلق', 19, 30),
(97, 'Al-Qadr', 'القدر', 5, 30),
(98, 'Al-Bayyinah', 'البينة', 8, 30),
(99, 'Az-Zalzalah', 'الزلزلة', 8, 30),
(100, 'Al-''Adiyat', 'العاديات', 11, 30),
(101, 'Al-Qari''ah', 'القارعة', 11, 30),
(102, 'At-Takathur', 'التكاثر', 8, 30),
(103, 'Al-''Asr', 'العصر', 3, 30),
(104, 'Al-Humazah', 'الهمزة', 9, 30),
(105, 'Al-Fil', 'الفيل', 5, 30),
(106, 'Quraysh', 'قريش', 4, 30),
(107, 'Al-Ma''un', 'الماعون', 7, 30),
(108, 'Al-Kawthar', 'الكوثر', 3, 30),
(109, 'Al-Kafirun', 'الكافرون', 6, 30),
(110, 'An-Nasr', 'النصر', 3, 30),
(111, 'Al-Masad', 'المسد', 5, 30),
(112, 'Al-Ikhlas', 'الإخلاص', 4, 30),
(113, 'Al-Falaq', 'الفلق', 5, 30),
(114, 'An-Nas', 'الناس', 6, 30);

-- ==========================================
-- SELESAI! 
-- Jalankan SQL ini di Supabase SQL Editor
-- ==========================================
