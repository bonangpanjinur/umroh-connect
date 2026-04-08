-- =============================================
-- IBADAH HABIT TRACKING TABLES
-- =============================================

-- Table for habit templates (predefined habits)
CREATE TABLE public.ibadah_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_arabic TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'wajib', -- wajib, sunnah, ramadan, dzikir
  icon TEXT,
  target_count INTEGER DEFAULT 1, -- how many times per day
  is_ramadan_specific BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user's daily habit logs
CREATE TABLE public.user_ibadah_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.ibadah_habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id, log_date)
);

-- Table for user's custom habits
CREATE TABLE public.user_custom_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  icon TEXT,
  target_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user's streak tracking
CREATE TABLE public.user_ibadah_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID REFERENCES public.ibadah_habits(id) ON DELETE CASCADE,
  custom_habit_id UUID REFERENCES public.user_custom_habits(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id),
  UNIQUE(user_id, custom_habit_id)
);

-- Enable RLS
ALTER TABLE public.ibadah_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ibadah_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ibadah_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ibadah_habits (public read, admin write)
CREATE POLICY "Anyone can view active habits" 
ON public.ibadah_habits 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage habits" 
ON public.ibadah_habits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_ibadah_logs
CREATE POLICY "Users can view own logs" 
ON public.user_ibadah_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs" 
ON public.user_ibadah_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" 
ON public.user_ibadah_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" 
ON public.user_ibadah_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for user_custom_habits
CREATE POLICY "Users can view own custom habits" 
ON public.user_custom_habits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own custom habits" 
ON public.user_custom_habits 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for user_ibadah_streaks
CREATE POLICY "Users can view own streaks" 
ON public.user_ibadah_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own streaks" 
ON public.user_ibadah_streaks 
FOR ALL 
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ibadah_habits_updated_at
BEFORE UPDATE ON public.ibadah_habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ibadah_logs_updated_at
BEFORE UPDATE ON public.user_ibadah_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_custom_habits_updated_at
BEFORE UPDATE ON public.user_custom_habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ibadah_streaks_updated_at
BEFORE UPDATE ON public.user_ibadah_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default habits
INSERT INTO public.ibadah_habits (name, name_arabic, description, category, icon, target_count, is_ramadan_specific, priority) VALUES
-- Ibadah Wajib
('Shalat Subuh', 'صلاة الفجر', 'Shalat wajib di waktu fajar', 'wajib', 'sun', 1, false, 100),
('Shalat Dzuhur', 'صلاة الظهر', 'Shalat wajib di waktu tengah hari', 'wajib', 'sun', 1, false, 99),
('Shalat Ashar', 'صلاة العصر', 'Shalat wajib di waktu sore', 'wajib', 'sunset', 1, false, 98),
('Shalat Maghrib', 'صلاة المغرب', 'Shalat wajib di waktu maghrib', 'wajib', 'moon', 1, false, 97),
('Shalat Isya', 'صلاة العشاء', 'Shalat wajib di waktu malam', 'wajib', 'moon', 1, false, 96),

-- Ibadah Sunnah
('Shalat Tahajud', 'صلاة التهجد', 'Shalat sunnah di sepertiga malam terakhir', 'sunnah', 'moon', 1, false, 90),
('Shalat Dhuha', 'صلاة الضحى', 'Shalat sunnah di waktu dhuha', 'sunnah', 'sun', 1, false, 89),
('Shalat Rawatib', 'صلاة الرواتب', 'Shalat sunnah sebelum/sesudah shalat wajib', 'sunnah', 'book', 1, false, 88),
('Membaca Al-Quran', 'تلاوة القرآن', 'Membaca dan tadabbur Al-Quran', 'sunnah', 'book-open', 1, false, 87),
('Sedekah', 'الصدقة', 'Bersedekah untuk orang yang membutuhkan', 'sunnah', 'heart', 1, false, 86),

-- Dzikir
('Dzikir Pagi', 'أذكار الصباح', 'Membaca dzikir pagi setelah Subuh', 'dzikir', 'sunrise', 1, false, 80),
('Dzikir Petang', 'أذكار المساء', 'Membaca dzikir petang setelah Ashar', 'dzikir', 'sunset', 1, false, 79),
('Istighfar 100x', 'الاستغفار', 'Membaca istighfar 100 kali sehari', 'dzikir', 'repeat', 100, false, 78),
('Shalawat 100x', 'الصلاة على النبي', 'Membaca shalawat 100 kali sehari', 'dzikir', 'heart', 100, false, 77),
('Tasbih, Tahmid, Takbir', 'التسبيح والتحميد والتكبير', 'Subhanallah, Alhamdulillah, Allahu Akbar 33x', 'dzikir', 'repeat', 33, false, 76),

-- Ibadah Ramadan
('Sahur', 'السحور', 'Makan sahur sebelum imsak', 'ramadan', 'utensils', 1, true, 95),
('Puasa', 'الصوم', 'Menjalankan ibadah puasa', 'ramadan', 'moon', 1, true, 94),
('Berbuka Puasa', 'الإفطار', 'Berbuka puasa tepat waktu', 'ramadan', 'utensils', 1, true, 93),
('Shalat Tarawih', 'صلاة التراويح', 'Shalat tarawih di malam Ramadan', 'ramadan', 'moon', 1, true, 92),
('Tadarus Al-Quran', 'تدارس القرآن', 'Khatam Al-Quran selama Ramadan', 'ramadan', 'book', 1, true, 91),
('Itikaf', 'الاعتكاف', 'Berdiam di masjid untuk beribadah', 'ramadan', 'home', 1, true, 85);