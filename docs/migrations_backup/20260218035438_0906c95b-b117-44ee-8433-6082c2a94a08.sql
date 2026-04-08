
-- Free trial tracking columns
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Khatam target table
CREATE TABLE quran_khatam_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_date DATE NOT NULL,
  pages_per_day NUMERIC(5,1) DEFAULT 0,
  ayat_per_day INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quran_khatam_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own khatam targets" ON quran_khatam_targets
  FOR ALL USING (auth.uid() = user_id);

-- Tips collection table
CREATE TABLE quran_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'motivasi',
  day_number INTEGER,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quran_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tips readable by all authenticated" ON quran_tips
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage tips" ON quran_tips
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Achievement badges table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);
