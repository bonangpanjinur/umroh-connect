-- =============================================
-- QURAN TADARUS TRACKING
-- =============================================

-- Surah reference table (for dropdown selection)
CREATE TABLE IF NOT EXISTS public.quran_surahs (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  total_verses INTEGER NOT NULL,
  juz_start INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User's Quran reading logs
CREATE TABLE IF NOT EXISTS public.user_quran_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  surah_number INTEGER NOT NULL,
  start_verse INTEGER NOT NULL DEFAULT 1,
  end_verse INTEGER NOT NULL,
  pages_read NUMERIC(4,1),
  juz_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date, surah_number, start_verse)
);

-- Enable RLS
ALTER TABLE public.quran_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quran_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quran_surahs
CREATE POLICY "Anyone can view surahs" ON public.quran_surahs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage surahs" ON public.quran_surahs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_quran_logs
CREATE POLICY "Users can view own logs" ON public.user_quran_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs" ON public.user_quran_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.user_quran_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.user_quran_logs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- MEAL TRACKING (SAHUR & IFTAR)
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('sahur', 'iftar')),
  is_skipped BOOLEAN DEFAULT false,
  water_glasses INTEGER DEFAULT 0,
  protein_source TEXT,
  carb_source TEXT,
  vegetables TEXT,
  fruits TEXT,
  notes TEXT,
  is_healthy BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date, meal_type)
);

-- Enable RLS
ALTER TABLE public.user_meal_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own meal logs" ON public.user_meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal logs" ON public.user_meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs" ON public.user_meal_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs" ON public.user_meal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DZIKIR TYPES (ADMIN MANAGED)
-- =============================================

CREATE TABLE IF NOT EXISTS public.dzikir_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_arabic TEXT,
  description TEXT,
  default_target INTEGER DEFAULT 33,
  category TEXT DEFAULT 'umum',
  icon TEXT DEFAULT 'circle',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User's dzikir logs (from Tasbih Digital)
CREATE TABLE IF NOT EXISTS public.user_dzikir_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dzikir_type_id UUID REFERENCES public.dzikir_types(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER DEFAULT 33,
  session_id TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dzikir_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dzikir_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dzikir_types
CREATE POLICY "Anyone can view active dzikir types" ON public.dzikir_types
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage dzikir types" ON public.dzikir_types
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_dzikir_logs
CREATE POLICY "Users can view own dzikir logs" ON public.user_dzikir_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dzikir logs" ON public.user_dzikir_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dzikir logs" ON public.user_dzikir_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dzikir logs" ON public.user_dzikir_logs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert 114 Surahs
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
(14, 'Ibrahim', 'ابراهيم', 52, 13),
(15, 'Al-Hijr', 'الحجر', 99, 14),
(16, 'An-Nahl', 'النحل', 128, 14),
(17, 'Al-Isra''', 'الإسراء', 111, 15),
(18, 'Al-Kahf', 'الكهف', 110, 15),
(19, 'Maryam', 'مريم', 98, 16),
(20, 'Ta-Ha', 'طه', 135, 16),
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
(34, 'Saba''', 'سبإ', 54, 22),
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
(58, 'Al-Mujadilah', 'المجادلة', 22, 28),
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
(76, 'Al-Insan', 'الانسان', 31, 29),
(77, 'Al-Mursalat', 'المرسلات', 50, 29),
(78, 'An-Naba''', 'النبإ', 40, 30),
(79, 'An-Nazi''at', 'النازعات', 46, 30),
(80, '''Abasa', 'عبس', 42, 30),
(81, 'At-Takwir', 'التكوير', 29, 30),
(82, 'Al-Infitar', 'الإنفطار', 19, 30),
(83, 'Al-Mutaffifin', 'المطففين', 36, 30),
(84, 'Al-Inshiqaq', 'الانشقاق', 25, 30),
(85, 'Al-Buruj', 'البروج', 22, 30),
(86, 'At-Tariq', 'الطارق', 17, 30),
(87, 'Al-A''la', 'الأعلى', 19, 30),
(88, 'Al-Ghashiyah', 'الغاشية', 26, 30),
(89, 'Al-Fajr', 'الفجر', 30, 30),
(90, 'Al-Balad', 'البلد', 20, 30),
(91, 'Ash-Shams', 'الشمس', 15, 30),
(92, 'Al-Lail', 'الليل', 21, 30),
(93, 'Ad-Duha', 'الضحى', 11, 30),
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
(106, 'Quraish', 'قريش', 4, 30),
(107, 'Al-Ma''un', 'الماعون', 7, 30),
(108, 'Al-Kauthar', 'الكوثر', 3, 30),
(109, 'Al-Kafirun', 'الكافرون', 6, 30),
(110, 'An-Nasr', 'النصر', 3, 30),
(111, 'Al-Masad', 'المسد', 5, 30),
(112, 'Al-Ikhlas', 'الإخلاص', 4, 30),
(113, 'Al-Falaq', 'الفلق', 5, 30),
(114, 'An-Nas', 'الناس', 6, 30)
ON CONFLICT (number) DO NOTHING;

-- Insert default dzikir types
INSERT INTO public.dzikir_types (name, name_arabic, description, default_target, category, priority) VALUES
('Istighfar', 'أستغفر الله', 'Astaghfirullah - Memohon ampunan', 100, 'taubat', 10),
('Tasbih', 'سبحان الله', 'Subhanallah - Maha Suci Allah', 33, 'tasbih', 9),
('Tahmid', 'الحمد لله', 'Alhamdulillah - Segala puji bagi Allah', 33, 'tasbih', 8),
('Takbir', 'الله أكبر', 'Allahu Akbar - Allah Maha Besar', 33, 'tasbih', 7),
('Tahlil', 'لا إله إلا الله', 'La ilaha illallah - Tiada Tuhan selain Allah', 100, 'tahlil', 6),
('Shalawat', 'اللهم صل على محمد', 'Shalawat kepada Nabi Muhammad SAW', 100, 'shalawat', 5),
('Hauqalah', 'لا حول ولا قوة إلا بالله', 'La haula wala quwwata illa billah', 33, 'dzikir', 4),
('Basmalah', 'بسم الله الرحمن الرحيم', 'Bismillahirrahmanirrahim', 33, 'dzikir', 3),
('Hasbalah', 'حسبنا الله ونعم الوكيل', 'Hasbunallah wa ni''mal wakil', 33, 'dzikir', 2)
ON CONFLICT DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_user_quran_logs_updated_at
  BEFORE UPDATE ON public.user_quran_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_meal_logs_updated_at
  BEFORE UPDATE ON public.user_meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dzikir_types_updated_at
  BEFORE UPDATE ON public.dzikir_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_dzikir_logs_updated_at
  BEFORE UPDATE ON public.user_dzikir_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();