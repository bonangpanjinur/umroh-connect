// Default habits organized by category
// These are the starter pack habits for new users

export interface DefaultHabit {
  id: string;
  name: string;
  name_arabic?: string;
  category: HabitCategory;
  icon: string;
  description?: string;
  target_count?: number;
  is_default: boolean;
  is_ramadan_specific?: boolean;
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  duration_minutes?: number;
}

export type HabitCategory = 
  | 'spiritual'
  | 'belajar'
  | 'kesehatan'
  | 'produktivitas'
  | 'mental'
  | 'sosial'
  | 'finansial';

export const categoryInfo: Record<HabitCategory, { 
  label: string; 
  icon: string; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  spiritual: {
    label: 'Spiritual & Ibadah',
    icon: 'flame',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    description: 'Ibadah wajib & sunnah harian'
  },
  belajar: {
    label: 'Belajar & Pengembangan',
    icon: 'book-open',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    description: 'Tingkatkan ilmu & skill'
  },
  kesehatan: {
    label: 'Kesehatan & Olahraga',
    icon: 'heart',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    description: 'Jaga kesehatan tubuh'
  },
  produktivitas: {
    label: 'Produktivitas & Disiplin',
    icon: 'target',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    description: 'Atur waktu & target harian'
  },
  mental: {
    label: 'Mental & Emosi',
    icon: 'brain',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    description: 'Kesehatan mental & emosional'
  },
  sosial: {
    label: 'Sosial & Akhlak',
    icon: 'users',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    description: 'Hubungan dengan sesama'
  },
  finansial: {
    label: 'Finansial',
    icon: 'wallet',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    description: 'Kelola keuangan'
  }
};

// Starter Pack: 12 default habits for new users
export const starterPackHabits: DefaultHabit[] = [
  // Spiritual (3)
  { id: 'sholat-waktu', name: 'Sholat Tepat Waktu', name_arabic: 'الصلاة في وقتها', category: 'spiritual', icon: 'clock', target_count: 5, is_default: true, time_of_day: 'anytime' },
  { id: 'tilawah', name: 'Tilawah Al-Quran', name_arabic: 'تلاوة القرآن', category: 'spiritual', icon: 'book', target_count: 1, is_default: true, time_of_day: 'morning' },
  { id: 'dzikir-pagi-petang', name: 'Dzikir Pagi & Petang', name_arabic: 'أذكار الصباح والمساء', category: 'spiritual', icon: 'sunrise', target_count: 2, is_default: true },
  
  // Belajar (2)
  { id: 'baca-buku', name: 'Baca Buku 15 Menit', category: 'belajar', icon: 'book-open', target_count: 1, is_default: true, duration_minutes: 15 },
  { id: 'belajar-skill', name: 'Belajar Skill Baru', category: 'belajar', icon: 'lightbulb', target_count: 1, is_default: true, duration_minutes: 30 },
  
  // Kesehatan (2)
  { id: 'jalan-kaki', name: 'Jalan Kaki 10.000 Langkah', category: 'kesehatan', icon: 'footprints', target_count: 1, is_default: true },
  { id: 'minum-air', name: 'Minum 8 Gelas Air', category: 'kesehatan', icon: 'droplets', target_count: 8, is_default: true },
  
  // Produktivitas (2)
  { id: 'todo-utama', name: '3 To-Do Utama', category: 'produktivitas', icon: 'check-square', target_count: 3, is_default: true, time_of_day: 'morning' },
  { id: 'evaluasi-hari', name: 'Evaluasi Hari', category: 'produktivitas', icon: 'clipboard-check', target_count: 1, is_default: true, time_of_day: 'evening' },
  
  // Mental (1)
  { id: 'jurnal-syukur', name: 'Jurnal 3 Syukur', category: 'mental', icon: 'heart', target_count: 1, is_default: true, time_of_day: 'evening' },
  
  // Sosial (1)
  { id: 'sedekah', name: 'Sedekah Harian', category: 'sosial', icon: 'hand-heart', target_count: 1, is_default: true },
  
  // Finansial (1)
  { id: 'catat-pengeluaran', name: 'Catat Pengeluaran', category: 'finansial', icon: 'receipt', target_count: 1, is_default: true, time_of_day: 'evening' },
];

// All available habits by category (enriched)
export const allHabitsByCategory: Record<HabitCategory, DefaultHabit[]> = {
  spiritual: [
    { id: 'sholat-waktu', name: 'Sholat Tepat Waktu', name_arabic: 'الصلاة في وقتها', category: 'spiritual', icon: 'clock', target_count: 5, is_default: true },
    { id: 'sholat-sunnah-rawatib', name: 'Sholat Sunnah Rawatib', name_arabic: 'صلاة السنة الرواتب', category: 'spiritual', icon: 'moon', target_count: 12, is_default: false, description: '12 rakaat sunnah sebelum & sesudah sholat wajib' },
    { id: 'sholat-dhuha', name: 'Sholat Dhuha', name_arabic: 'صلاة الضحى', category: 'spiritual', icon: 'sunrise', target_count: 1, is_default: false, time_of_day: 'morning' },
    { id: 'sholat-tahajud', name: 'Sholat Tahajud', name_arabic: 'صلاة التهجد', category: 'spiritual', icon: 'moon', target_count: 1, is_default: false, time_of_day: 'morning' },
    { id: 'tilawah', name: 'Tilawah Al-Quran', name_arabic: 'تلاوة القرآن', category: 'spiritual', icon: 'book', target_count: 1, is_default: true },
    { id: 'tilawah-1-juz', name: 'Khatam 1 Juz', name_arabic: 'ختم جزء واحد', category: 'spiritual', icon: 'book', target_count: 1, is_default: false },
    { id: 'dzikir-pagi-petang', name: 'Dzikir Pagi & Petang', name_arabic: 'أذكار الصباح والمساء', category: 'spiritual', icon: 'sunrise', target_count: 2, is_default: true },
    { id: 'istighfar', name: 'Istighfar 100x', name_arabic: 'الاستغفار', category: 'spiritual', icon: 'sparkles', target_count: 100, is_default: false },
    { id: 'sholawat', name: 'Sholawat 100x', name_arabic: 'الصلوات على النبي', category: 'spiritual', icon: 'sparkles', target_count: 100, is_default: false },
    { id: 'puasa-sunnah', name: 'Puasa Sunnah', name_arabic: 'صيام التطوع', category: 'spiritual', icon: 'moon', target_count: 1, is_default: false },
    { id: 'kajian', name: 'Kajian Ilmu Agama', category: 'spiritual', icon: 'book-open', target_count: 1, is_default: false, duration_minutes: 30 },
    { id: 'muhasabah', name: 'Muhasabah Diri', category: 'spiritual', icon: 'brain', target_count: 1, is_default: false, time_of_day: 'evening' },
    { id: 'hafalan-quran', name: 'Hafalan Al-Quran', name_arabic: 'حفظ القرآن', category: 'spiritual', icon: 'book', target_count: 1, is_default: false },
    // Ramadan specific
    { id: 'tarawih', name: 'Sholat Tarawih', name_arabic: 'صلاة التراويح', category: 'spiritual', icon: 'moon', target_count: 1, is_default: false, is_ramadan_specific: true },
    { id: 'puasa-wajib', name: 'Puasa Ramadan', name_arabic: 'صيام رمضان', category: 'spiritual', icon: 'moon', target_count: 1, is_default: false, is_ramadan_specific: true },
    { id: 'qiyamul-lail', name: 'Qiyamul Lail', name_arabic: 'قيام الليل', category: 'spiritual', icon: 'sparkles', target_count: 1, is_default: false, is_ramadan_specific: true },
    { id: 'tadarus', name: 'Tadarus Ramadan', name_arabic: 'تدارس رمضان', category: 'spiritual', icon: 'book', target_count: 1, is_default: false, is_ramadan_specific: true },
  ],
  belajar: [
    { id: 'baca-buku', name: 'Baca Buku 15 Menit', category: 'belajar', icon: 'book-open', target_count: 1, is_default: true, duration_minutes: 15 },
    { id: 'baca-buku-30', name: 'Baca Buku 30 Menit', category: 'belajar', icon: 'book-open', target_count: 1, is_default: false, duration_minutes: 30 },
    { id: 'belajar-skill', name: 'Belajar Skill Baru', category: 'belajar', icon: 'lightbulb', target_count: 1, is_default: true, duration_minutes: 30 },
    { id: 'online-course', name: 'Online Course', category: 'belajar', icon: 'graduation-cap', target_count: 1, is_default: false, duration_minutes: 60 },
    { id: 'review-catatan', name: 'Review Catatan', category: 'belajar', icon: 'clipboard-check', target_count: 1, is_default: false },
    { id: 'journaling', name: 'Journaling / Menulis', category: 'belajar', icon: 'clipboard-check', target_count: 1, is_default: false },
    { id: 'podcast', name: 'Dengar Podcast Edukatif', category: 'belajar', icon: 'headphones', target_count: 1, is_default: false, duration_minutes: 20 },
    { id: 'bahasa-asing', name: 'Belajar Bahasa Asing', category: 'belajar', icon: 'message-circle', target_count: 1, is_default: false, duration_minutes: 15 },
    { id: 'coding', name: 'Latihan Coding', category: 'belajar', icon: 'target', target_count: 1, is_default: false, duration_minutes: 30 },
    { id: 'belajar-quran', name: 'Belajar Tajwid', category: 'belajar', icon: 'book', target_count: 1, is_default: false },
  ],
  kesehatan: [
    { id: 'jalan-kaki', name: 'Jalan Kaki 10.000 Langkah', category: 'kesehatan', icon: 'footprints', target_count: 1, is_default: true },
    { id: 'jalan-pagi', name: 'Jalan Pagi 30 Menit', category: 'kesehatan', icon: 'footprints', target_count: 1, is_default: false, time_of_day: 'morning', duration_minutes: 30 },
    { id: 'olahraga-ringan', name: 'Olahraga Ringan', category: 'kesehatan', icon: 'dumbbell', target_count: 1, is_default: false, duration_minutes: 20 },
    { id: 'workout', name: 'Workout / Gym', category: 'kesehatan', icon: 'dumbbell', target_count: 1, is_default: false, duration_minutes: 60 },
    { id: 'yoga', name: 'Yoga / Stretching', category: 'kesehatan', icon: 'heart', target_count: 1, is_default: false, duration_minutes: 15 },
    { id: 'minum-air', name: 'Minum 8 Gelas Air', category: 'kesehatan', icon: 'droplets', target_count: 8, is_default: true },
    { id: 'tidur-cukup', name: 'Tidur 7-8 Jam', category: 'kesehatan', icon: 'moon', target_count: 1, is_default: false },
    { id: 'tidur-awal', name: 'Tidur Sebelum Jam 10', category: 'kesehatan', icon: 'moon', target_count: 1, is_default: false, time_of_day: 'evening' },
    { id: 'bangun-subuh', name: 'Bangun Sebelum Subuh', category: 'kesehatan', icon: 'sunrise', target_count: 1, is_default: false, time_of_day: 'morning' },
    { id: 'makan-sehat', name: 'Makan Sayur & Buah', category: 'kesehatan', icon: 'heart', target_count: 1, is_default: false },
    { id: 'no-junk-food', name: 'No Junk Food', category: 'kesehatan', icon: 'heart', target_count: 1, is_default: false },
    { id: 'push-up', name: 'Push Up', category: 'kesehatan', icon: 'dumbbell', target_count: 20, is_default: false },
    { id: 'plank', name: 'Plank 1 Menit', category: 'kesehatan', icon: 'dumbbell', target_count: 1, is_default: false },
    { id: 'berenang', name: 'Berenang', category: 'kesehatan', icon: 'heart', target_count: 1, is_default: false },
    { id: 'bersepeda', name: 'Bersepeda', category: 'kesehatan', icon: 'heart', target_count: 1, is_default: false },
  ],
  produktivitas: [
    { id: 'bangun-pagi', name: 'Bangun Sebelum Jam 5', category: 'produktivitas', icon: 'sunrise', target_count: 1, is_default: false, time_of_day: 'morning' },
    { id: 'todo-utama', name: '3 To-Do Utama', category: 'produktivitas', icon: 'check-square', target_count: 3, is_default: true, time_of_day: 'morning' },
    { id: 'deep-work', name: 'Deep Work 2 Jam', category: 'produktivitas', icon: 'target', target_count: 1, is_default: false, duration_minutes: 120 },
    { id: 'pomodoro', name: '4 Sesi Pomodoro', category: 'produktivitas', icon: 'clock', target_count: 4, is_default: false },
    { id: 'inbox-zero', name: 'Inbox Zero Email', category: 'produktivitas', icon: 'check-square', target_count: 1, is_default: false },
    { id: 'rapikan-meja', name: 'Rapikan Meja Kerja', category: 'produktivitas', icon: 'check-square', target_count: 1, is_default: false },
    { id: 'bersih-kamar', name: 'Bersih-Bersih Kamar', category: 'produktivitas', icon: 'check-square', target_count: 1, is_default: false },
    { id: 'evaluasi-hari', name: 'Evaluasi Hari', category: 'produktivitas', icon: 'clipboard-check', target_count: 1, is_default: true, time_of_day: 'evening' },
    { id: 'planning-besok', name: 'Planning Besok', category: 'produktivitas', icon: 'calendar', target_count: 1, is_default: false, time_of_day: 'evening' },
    { id: 'weekly-review', name: 'Weekly Review', category: 'produktivitas', icon: 'clipboard-check', target_count: 1, is_default: false },
    { id: 'no-procrastinate', name: 'No Prokrastinasi', category: 'produktivitas', icon: 'target', target_count: 1, is_default: false },
  ],
  mental: [
    { id: 'jurnal-syukur', name: 'Jurnal 3 Syukur', category: 'mental', icon: 'heart', target_count: 1, is_default: true, time_of_day: 'evening' },
    { id: 'meditasi', name: 'Meditasi / Tafakur', category: 'mental', icon: 'brain', target_count: 1, is_default: false, duration_minutes: 10 },
    { id: 'nafas-dalam', name: 'Latihan Nafas Dalam', category: 'mental', icon: 'heart', target_count: 1, is_default: false, duration_minutes: 5 },
    { id: 'kontrol-emosi', name: 'Kontrol Emosi', category: 'mental', icon: 'smile', target_count: 1, is_default: false },
    { id: 'no-marah', name: 'No Marah Hari Ini', category: 'mental', icon: 'smile', target_count: 1, is_default: false },
    { id: 'kurangi-overthink', name: 'Kurangi Overthinking', category: 'mental', icon: 'brain', target_count: 1, is_default: false },
    { id: 'detoks-sosmed', name: 'Detoks Sosial Media', category: 'mental', icon: 'smartphone', target_count: 1, is_default: false },
    { id: 'screen-time', name: 'Screen Time < 3 Jam', category: 'mental', icon: 'smartphone', target_count: 1, is_default: false },
    { id: 'self-affirmation', name: 'Self Affirmation', category: 'mental', icon: 'sparkles', target_count: 1, is_default: false, time_of_day: 'morning' },
    { id: 'self-reflection', name: 'Self Reflection', category: 'mental', icon: 'brain', target_count: 1, is_default: false, time_of_day: 'evening' },
    { id: 'quality-time', name: 'Quality Time Keluarga', category: 'mental', icon: 'users', target_count: 1, is_default: false },
    { id: 'hobi', name: 'Luangkan Waktu untuk Hobi', category: 'mental', icon: 'heart', target_count: 1, is_default: false },
  ],
  sosial: [
    { id: 'silaturahmi', name: 'Silaturahmi', category: 'sosial', icon: 'users', target_count: 1, is_default: false },
    { id: 'hubungi-keluarga', name: 'Hubungi Keluarga', category: 'sosial', icon: 'users', target_count: 1, is_default: false },
    { id: 'hubungi-teman', name: 'Hubungi Teman Lama', category: 'sosial', icon: 'message-circle', target_count: 1, is_default: false },
    { id: 'bantu-orang', name: 'Bantu Orang Lain', category: 'sosial', icon: 'hand-heart', target_count: 1, is_default: false },
    { id: 'sedekah', name: 'Sedekah Harian', category: 'sosial', icon: 'hand-heart', target_count: 1, is_default: true },
    { id: 'sedekah-subuh', name: 'Sedekah Subuh', category: 'sosial', icon: 'sunrise', target_count: 1, is_default: false, time_of_day: 'morning' },
    { id: 'jaga-lisan', name: 'Jaga Lisan', category: 'sosial', icon: 'message-circle', target_count: 1, is_default: false },
    { id: 'no-ghibah', name: 'No Ghibah / Gosip', category: 'sosial', icon: 'message-circle', target_count: 1, is_default: false },
    { id: 'minta-maaf', name: 'Minta & Beri Maaf', category: 'sosial', icon: 'heart', target_count: 1, is_default: false },
    { id: 'senyum', name: 'Senyum & Sapa', category: 'sosial', icon: 'smile', target_count: 5, is_default: false },
    { id: 'volunteer', name: 'Volunteer / Relawan', category: 'sosial', icon: 'users', target_count: 1, is_default: false },
    { id: 'apresiasi', name: 'Beri Apresiasi Orang Lain', category: 'sosial', icon: 'sparkles', target_count: 1, is_default: false },
  ],
  finansial: [
    { id: 'catat-pengeluaran', name: 'Catat Pengeluaran', category: 'finansial', icon: 'receipt', target_count: 1, is_default: true, time_of_day: 'evening' },
    { id: 'nabung', name: 'Nabung Harian', category: 'finansial', icon: 'coins', target_count: 1, is_default: false },
    { id: 'investasi', name: 'Investasi', category: 'finansial', icon: 'target', target_count: 1, is_default: false },
    { id: 'sedekah-rutin', name: 'Sedekah Rutin', category: 'finansial', icon: 'coins', target_count: 1, is_default: false },
    { id: 'infaq', name: 'Infaq Mingguan', category: 'finansial', icon: 'hand-heart', target_count: 1, is_default: false },
    { id: 'no-impulsif', name: 'No Belanja Impulsif', category: 'finansial', icon: 'target', target_count: 1, is_default: false },
    { id: 'budget-harian', name: 'Ikuti Budget Harian', category: 'finansial', icon: 'receipt', target_count: 1, is_default: false },
    { id: 'review-keuangan', name: 'Review Keuangan', category: 'finansial', icon: 'clipboard-check', target_count: 1, is_default: false },
    { id: 'bersihkan-subscription', name: 'Cek Subscription', category: 'finansial', icon: 'receipt', target_count: 1, is_default: false },
  ],
};

// Get habits with Ramadan extras
export const getHabitsForMode = (isRamadhanMode: boolean): DefaultHabit[] => {
  const allHabits = Object.values(allHabitsByCategory).flat();
  
  if (isRamadhanMode) {
    return allHabits;
  }
  
  // Filter out Ramadan-specific habits in normal mode
  return allHabits.filter(h => !h.is_ramadan_specific);
};

// Get starter habits only
export const getStarterHabits = (): DefaultHabit[] => {
  return starterPackHabits;
};

// Get habits by time of day
export const getHabitsByTimeOfDay = (timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime'): DefaultHabit[] => {
  const allHabits = Object.values(allHabitsByCategory).flat();
  return allHabits.filter(h => h.time_of_day === timeOfDay || h.time_of_day === 'anytime');
};
