
-- =============================================
-- SEDEKAH (CHARITY) TRACKING TABLES
-- =============================================

-- Sedekah types master data
CREATE TABLE IF NOT EXISTS public.sedekah_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_arabic text,
  icon text DEFAULT 'heart',
  description text,
  category text NOT NULL DEFAULT 'uang' CHECK (category IN ('uang', 'makanan', 'tenaga', 'barang', 'kebaikan')),
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User sedekah logs
CREATE TABLE IF NOT EXISTS public.user_sedekah_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sedekah_type_id uuid REFERENCES public.sedekah_types(id) ON DELETE SET NULL,
  amount numeric DEFAULT 0,
  description text,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  is_subuh_mode boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- OLAHRAGA (EXERCISE) TRACKING TABLES
-- =============================================

-- Exercise types master data
CREATE TABLE IF NOT EXISTS public.exercise_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT 'activity',
  description text,
  intensity text NOT NULL DEFAULT 'ringan' CHECK (intensity IN ('ringan', 'sedang', 'berat')),
  recommended_time text DEFAULT 'setelah_tarawih' CHECK (recommended_time IN ('sebelum_berbuka', 'setelah_tarawih', 'setelah_sahur', 'kapan_saja')),
  duration_minutes integer DEFAULT 15,
  is_ramadan_friendly boolean DEFAULT true,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User exercise logs
CREATE TABLE IF NOT EXISTS public.user_exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type_id uuid REFERENCES public.exercise_types(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL DEFAULT 15,
  intensity text DEFAULT 'ringan',
  notes text,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  time_of_day text DEFAULT 'setelah_tarawih',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- RAMADAN SETTINGS & TARGETS
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_ramadan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ramadan_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  sedekah_target numeric DEFAULT 0,
  tilawah_target_pages integer DEFAULT 20,
  enable_sedekah_reminder boolean DEFAULT true,
  enable_exercise_reminder boolean DEFAULT true,
  enable_lailatul_qadar_mode boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.sedekah_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sedekah_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ramadan_settings ENABLE ROW LEVEL SECURITY;

-- Sedekah types policies
CREATE POLICY "Anyone can view active sedekah types" ON public.sedekah_types
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sedekah types" ON public.sedekah_types
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User sedekah logs policies
CREATE POLICY "Users can view own sedekah logs" ON public.user_sedekah_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sedekah logs" ON public.user_sedekah_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sedekah logs" ON public.user_sedekah_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sedekah logs" ON public.user_sedekah_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise types policies
CREATE POLICY "Anyone can view active exercise types" ON public.exercise_types
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage exercise types" ON public.exercise_types
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User exercise logs policies
CREATE POLICY "Users can view own exercise logs" ON public.user_exercise_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exercise logs" ON public.user_exercise_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise logs" ON public.user_exercise_logs
  FOR DELETE USING (auth.uid() = user_id);

-- User ramadan settings policies
CREATE POLICY "Users can view own ramadan settings" ON public.user_ramadan_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ramadan settings" ON public.user_ramadan_settings
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA - Sedekah Types
-- =============================================

INSERT INTO public.sedekah_types (name, name_arabic, icon, description, category, priority) VALUES
('Sedekah Uang', 'صدقة المال', 'banknote', 'Sedekah berupa uang tunai atau transfer', 'uang', 1),
('Sedekah Makanan', 'صدقة الطعام', 'utensils', 'Sedekah berupa makanan, takjil, atau buka puasa', 'makanan', 2),
('Sedekah Tenaga', 'صدقة الجهد', 'hand-helping', 'Membantu orang lain dengan tenaga', 'tenaga', 3),
('Sedekah Barang', 'صدقة المتاع', 'package', 'Memberikan barang yang bermanfaat', 'barang', 4),
('Sedekah Senyum', 'التبسم صدقة', 'smile', 'Tersenyum kepada sesama adalah sedekah', 'kebaikan', 5),
('Sedekah Ilmu', 'صدقة العلم', 'book-open', 'Mengajarkan ilmu yang bermanfaat', 'kebaikan', 6),
('Sedekah Doa', 'صدقة الدعاء', 'heart', 'Mendoakan kebaikan untuk orang lain', 'kebaikan', 7)
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED DATA - Exercise Types
-- =============================================

INSERT INTO public.exercise_types (name, icon, description, intensity, recommended_time, duration_minutes, priority) VALUES
('Jalan Kaki Ringan', 'footprints', 'Jalan santai 10-15 menit', 'ringan', 'setelah_tarawih', 15, 1),
('Stretching', 'move', 'Peregangan otot ringan', 'ringan', 'kapan_saja', 10, 2),
('Bodyweight Ringan', 'dumbbell', 'Push-up, sit-up ringan', 'sedang', 'setelah_tarawih', 20, 3),
('Yoga / Mobility', 'activity', 'Gerakan yoga dan mobilitas', 'ringan', 'sebelum_berbuka', 15, 4),
('Olahraga Setelah Tarawih', 'moon', 'Olahraga ringan-sedang setelah tarawih', 'sedang', 'setelah_tarawih', 30, 5),
('Olahraga Sebelum Berbuka', 'sunset', 'Olahraga ringan 30 menit sebelum berbuka', 'ringan', 'sebelum_berbuka', 20, 6),
('Sepeda Santai', 'bike', 'Bersepeda santai di sekitar rumah', 'ringan', 'setelah_tarawih', 20, 7),
('Berenang Ringan', 'waves', 'Berenang santai', 'sedang', 'setelah_tarawih', 30, 8)
ON CONFLICT DO NOTHING;

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_sedekah_types_updated_at
  BEFORE UPDATE ON public.sedekah_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sedekah_logs_updated_at
  BEFORE UPDATE ON public.user_sedekah_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_types_updated_at
  BEFORE UPDATE ON public.exercise_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ramadan_settings_updated_at
  BEFORE UPDATE ON public.user_ramadan_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add more default ibadah habits for Ramadan
INSERT INTO public.ibadah_habits (name, name_arabic, category, icon, target_count, is_ramadan_specific, priority) VALUES
('I''tikaf', 'اعتكاف', 'ramadan', 'home', 1, true, 20),
('Qiyamul Lail', 'قيام الليل', 'sunnah', 'moon', 1, false, 21),
('Sedekah Harian', 'صدقة يومية', 'sunnah', 'heart', 1, false, 22),
('Baca Hadits', 'قراءة الحديث', 'sunnah', 'book', 1, false, 23),
('Silaturahmi', 'صلة الرحم', 'sunnah', 'users', 1, false, 24)
ON CONFLICT DO NOTHING;
