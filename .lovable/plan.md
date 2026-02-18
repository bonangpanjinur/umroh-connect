

# Analisis & Peningkatan Menu Tracker/Ibadah

## Analisis Kekurangan Saat Ini

### 1. Model Bisnis Lemah
- **Gratis vs Premium tidak jelas**: Saat ini hanya membedakan "local storage" (gratis) vs "cloud sync" (premium). Ini bukan value proposition yang kuat karena user merasa fitur gratis sudah cukup.
- **Tidak ada trial period**: User langsung diminta bayar tanpa merasakan manfaat premium terlebih dahulu.
- **Fitur premium kurang menarik**: Hanya cloud sync dan backup -- tidak ada konten eksklusif.

### 2. UX Kekurangan
- **Tidak ada onboarding/guided tour**: User baru langsung dihadapkan interface kompleks tanpa arahan.
- **Tadarus tanpa kalkulator khatam**: Tidak ada estimasi kapan user bisa khatam berdasarkan kecepatan baca.
- **Tips statis**: Hanya 1 tips hardcoded di TadarusView ("Baca minimal 1 halaman...").
- **Tidak ada achievement/gamification**: Tidak ada badge, milestone celebration, atau reward visual.
- **Tidak ada daily motivation/reminder konten**: Tidak ada konten inspiratif harian yang membuat user kembali.

### 3. Fitur yang Hilang
- Kalkulator Khatam (estimasi target berdasarkan pace)
- Tips & trik hatam Quran yang berputar/dinamis
- Achievement badges (7 hari berturut, khatam 1 juz, dll)
- Daily Islamic motivation/hadits
- Sharing progress ke sosial media
- Streak protection (gratis 1x, premium unlimited)

---

## Rencana Implementasi

### Tahap A: Free Trial 30 Hari + Kalkulator Khatam

**1. Free Trial System**
- Tambah kolom `trial_start_date` dan `trial_end_date` di tabel `user_subscriptions`
- User baru otomatis mendapat 30 hari full access saat pertama kali menggunakan tracker
- Setelah 30 hari, fitur premium (cloud sync, statistik lengkap, kalkulator khatam) terkunci
- UI menampilkan countdown sisa trial ("15 hari lagi trial berakhir")

**2. Kalkulator Khatam Al-Quran**
- Komponen baru: `KhatamCalculator`
- Input: target khatam (tanggal atau jumlah hari)
- Output: berapa halaman/ayat per hari yang harus dibaca
- Integrasi dengan data tadarus aktual untuk menampilkan apakah user on-track atau behind
- Menampilkan estimasi tanggal khatam berdasarkan pace saat ini

**3. Tips & Trik Dinamis**
- Koleksi 30+ tips hatam Quran yang berputar harian
- Kategori: motivasi, teknik membaca, adab tilawah, keutamaan surat
- Ditampilkan sebagai card yang berubah setiap hari di halaman Tadarus
- Premium: akses semua tips sekaligus + tips audio dari ustadz

### Tahap B: Achievement & Gamification

**4. Achievement System**
- Badge milestones: "7 Hari Berturut", "1 Juz Tercapai", "Khatam!", "100 Hari Istiqomah"
- Visual celebration (confetti animation) saat unlock badge
- Streak counter yang lebih prominent dengan streak protection (1x gratis, premium unlimited)

**5. Daily Motivation Card**
- Hadits/ayat harian yang relevan dengan ibadah user
- Rotasi otomatis setiap hari
- Fitur share ke WhatsApp/media sosial

---

## Detail Teknis

### Database Migration

```text
-- Free trial tracking
ALTER TABLE user_subscriptions 
  ADD COLUMN trial_start_date TIMESTAMPTZ,
  ADD COLUMN trial_end_date TIMESTAMPTZ;

-- Khatam target
CREATE TABLE quran_khatam_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_date DATE NOT NULL,
  pages_per_day NUMERIC(5,1) DEFAULT 0,
  ayat_per_day INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, is_active)
);
ALTER TABLE quran_khatam_targets ENABLE ROW LEVEL SECURITY;

-- Tips collection
CREATE TABLE quran_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'motivasi',
  day_number INTEGER, -- for daily rotation
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quran_tips ENABLE ROW LEVEL SECURITY;

-- Achievement badges
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own khatam targets" ON quran_khatam_targets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tips readable by all authenticated" ON quran_tips
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);
```

### File Baru
1. `src/components/habit/KhatamCalculator.tsx` -- Kalkulator target khatam dengan visual progress
2. `src/components/habit/QuranTipsCard.tsx` -- Card tips harian yang berputar
3. `src/components/habit/AchievementBadges.tsx` -- Display achievement dan celebration
4. `src/hooks/useKhatamTarget.ts` -- Hook CRUD khatam target
5. `src/hooks/useQuranTips.ts` -- Hook fetch tips harian
6. `src/hooks/useAchievements.ts` -- Hook achievement tracking
7. `src/hooks/useFreeTrial.ts` -- Hook cek status trial 30 hari

### File yang Dimodifikasi
1. `src/components/habit/TadarusView.tsx` -- Tambah KhatamCalculator + QuranTipsCard
2. `src/components/habit/IbadahHubView.tsx` -- Tambah trial banner + achievement summary
3. `src/components/premium/PremiumUpgradeModal.tsx` -- Update untuk trial flow
4. `src/hooks/usePremiumSubscription.ts` -- Tambah logic trial period
5. `src/hooks/useQuranTracking.ts` -- Tambah achievement trigger saat log tadarus

### Alur Trial 30 Hari
1. User pertama kali buka Tracker -> sistem set `trial_start_date = now()`, `trial_end_date = now + 30 days`
2. Selama trial: semua fitur premium terbuka (cloud sync, kalkulator khatam, tips premium)
3. Banner kecil: "Trial Premium: 25 hari tersisa"
4. Hari ke-25: notifikasi "5 hari lagi trial berakhir"
5. Setelah expired: fitur premium terkunci, tampilkan modal upgrade dengan highlight fitur yang sudah dipakai

### Seed Data Tips (20+ tips)
Tips akan di-seed langsung ke tabel `quran_tips` mencakup kategori: motivasi, teknik, adab, dan keutamaan surat.

