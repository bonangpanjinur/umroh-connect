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

// Starter Pack: 10-12 default habits for new users
export const starterPackHabits: DefaultHabit[] = [
  // Spiritual (3)
  { id: 'sholat-waktu', name: 'Sholat Tepat Waktu', name_arabic: 'الصلاة في وقتها', category: 'spiritual', icon: 'clock', target_count: 5, is_default: true },
  { id: 'tilawah', name: 'Tilawah Al-Quran', name_arabic: 'تلاوة القرآن', category: 'spiritual', icon: 'book', target_count: 1, is_default: true },
  { id: 'dzikir-pagi-petang', name: 'Dzikir Pagi & Petang', name_arabic: 'أذكار الصباح والمساء', category: 'spiritual', icon: 'sunrise', target_count: 2, is_default: true },
  
  // Belajar (2)
  { id: 'baca-buku', name: 'Baca Buku', category: 'belajar', icon: 'book-open', target_count: 1, is_default: true },
  { id: 'belajar-15min', name: 'Belajar 15 Menit', category: 'belajar', icon: 'graduation-cap', target_count: 1, is_default: true },
  
  // Kesehatan (2)
  { id: 'jalan-kaki', name: 'Jalan Kaki', category: 'kesehatan', icon: 'footprints', target_count: 1, is_default: true },
  { id: 'minum-air', name: 'Minum Air Cukup', category: 'kesehatan', icon: 'droplets', target_count: 8, is_default: true },
  
  // Produktivitas (2)
  { id: 'todo-utama', name: 'To-Do Utama Hari Ini', category: 'produktivitas', icon: 'check-square', target_count: 3, is_default: true },
  { id: 'evaluasi-hari', name: 'Evaluasi Hari', category: 'produktivitas', icon: 'clipboard-check', target_count: 1, is_default: true },
  
  // Mental (1)
  { id: 'jurnal-syukur', name: 'Jurnal Syukur', category: 'mental', icon: 'heart', target_count: 3, is_default: true },
  
  // Sosial (1)
  { id: 'sedekah', name: 'Sedekah', category: 'sosial', icon: 'hand-heart', target_count: 1, is_default: true },
];

// All available habits by category
export const allHabitsByCategory: Record<HabitCategory, DefaultHabit[]> = {
  spiritual: [
    { id: 'sholat-waktu', name: 'Sholat Tepat Waktu', name_arabic: 'الصلاة في وقتها', category: 'spiritual', icon: 'clock', target_count: 5, is_default: true },
    { id: 'sholat-sunnah', name: 'Sholat Sunnah', name_arabic: 'صلاة السنة', category: 'spiritual', icon: 'moon', target_count: 1, is_default: false },
    { id: 'tilawah', name: 'Tilawah Al-Quran', name_arabic: 'تلاوة القرآن', category: 'spiritual', icon: 'book', target_count: 1, is_default: true },
    { id: 'dzikir-pagi-petang', name: 'Dzikir Pagi & Petang', name_arabic: 'أذكار الصباح والمساء', category: 'spiritual', icon: 'sunrise', target_count: 2, is_default: true },
    { id: 'puasa-sunnah', name: 'Puasa Sunnah', name_arabic: 'صيام التطوع', category: 'spiritual', icon: 'utensils', target_count: 1, is_default: false },
    { id: 'kajian', name: 'Kajian / Ilmu Agama', category: 'spiritual', icon: 'book-open', target_count: 1, is_default: false },
    { id: 'muhasabah', name: 'Muhasabah / Refleksi Diri', category: 'spiritual', icon: 'eye', target_count: 1, is_default: false },
    // Ramadan specific
    { id: 'tarawih', name: 'Sholat Tarawih', name_arabic: 'صلاة التراويح', category: 'spiritual', icon: 'moon', target_count: 1, is_default: false, is_ramadan_specific: true },
    { id: 'puasa-wajib', name: 'Puasa Ramadan', name_arabic: 'صيام رمضان', category: 'spiritual', icon: 'utensils', target_count: 1, is_default: false, is_ramadan_specific: true },
    { id: 'qiyamul-lail', name: 'Qiyamul Lail', name_arabic: 'قيام الليل', category: 'spiritual', icon: 'sparkles', target_count: 1, is_default: false, is_ramadan_specific: true },
  ],
  belajar: [
    { id: 'baca-buku', name: 'Baca Buku', category: 'belajar', icon: 'book-open', target_count: 1, is_default: true },
    { id: 'belajar-skill', name: 'Belajar Skill Baru', category: 'belajar', icon: 'lightbulb', target_count: 1, is_default: false },
    { id: 'review-catatan', name: 'Review Catatan', category: 'belajar', icon: 'file-text', target_count: 1, is_default: false },
    { id: 'journaling', name: 'Nulis / Journaling', category: 'belajar', icon: 'pen-tool', target_count: 1, is_default: false },
    { id: 'podcast-kajian', name: 'Dengar Podcast / Kajian', category: 'belajar', icon: 'headphones', target_count: 1, is_default: false },
    { id: 'belajar-15min', name: 'Belajar 15 Menit', category: 'belajar', icon: 'graduation-cap', target_count: 1, is_default: true },
  ],
  kesehatan: [
    { id: 'jalan-kaki', name: 'Jalan Kaki', category: 'kesehatan', icon: 'footprints', target_count: 1, is_default: true },
    { id: 'olahraga-ringan', name: 'Olahraga Ringan', category: 'kesehatan', icon: 'dumbbell', target_count: 1, is_default: false },
    { id: 'stretching', name: 'Stretching', category: 'kesehatan', icon: 'move', target_count: 1, is_default: false },
    { id: 'minum-air', name: 'Minum Air Cukup', category: 'kesehatan', icon: 'droplets', target_count: 8, is_default: true },
    { id: 'tidur-waktu', name: 'Tidur Tepat Waktu', category: 'kesehatan', icon: 'moon', target_count: 1, is_default: false },
    { id: 'pola-makan', name: 'Jaga Pola Makan', category: 'kesehatan', icon: 'apple', target_count: 1, is_default: false },
  ],
  produktivitas: [
    { id: 'bangun-pagi', name: 'Bangun Pagi', category: 'produktivitas', icon: 'sunrise', target_count: 1, is_default: false },
    { id: 'todo-utama', name: 'To-Do Utama Hari Ini', category: 'produktivitas', icon: 'check-square', target_count: 3, is_default: true },
    { id: 'deep-work', name: 'Fokus Kerja (Deep Work)', category: 'produktivitas', icon: 'focus', target_count: 1, is_default: false },
    { id: 'beres-beres', name: 'Beres-Beres', category: 'produktivitas', icon: 'home', target_count: 1, is_default: false },
    { id: 'evaluasi-hari', name: 'Evaluasi Hari', category: 'produktivitas', icon: 'clipboard-check', target_count: 1, is_default: true },
    { id: 'planning-besok', name: 'Planning Besok', category: 'produktivitas', icon: 'calendar', target_count: 1, is_default: false },
  ],
  mental: [
    { id: 'jurnal-syukur', name: 'Jurnal Syukur', category: 'mental', icon: 'heart', target_count: 3, is_default: true },
    { id: 'kontrol-emosi', name: 'Kontrol Emosi', category: 'mental', icon: 'smile', target_count: 1, is_default: false },
    { id: 'kurangi-overthink', name: 'Kurangi Overthinking', category: 'mental', icon: 'brain', target_count: 1, is_default: false },
    { id: 'no-marah', name: 'No Marah Hari Ini', category: 'mental', icon: 'shield', target_count: 1, is_default: false },
    { id: 'detoks-sosmed', name: 'Detoks Sosial Media', category: 'mental', icon: 'smartphone-off', target_count: 1, is_default: false },
    { id: 'self-reflection', name: 'Self-Reflection', category: 'mental', icon: 'eye', target_count: 1, is_default: false },
  ],
  sosial: [
    { id: 'silaturahmi', name: 'Silaturahmi', category: 'sosial', icon: 'users', target_count: 1, is_default: false },
    { id: 'bantu-orang', name: 'Bantu Orang Lain', category: 'sosial', icon: 'hand-helping', target_count: 1, is_default: false },
    { id: 'sedekah', name: 'Sedekah', category: 'sosial', icon: 'hand-heart', target_count: 1, is_default: true },
    { id: 'jaga-lisan', name: 'Jaga Lisan', category: 'sosial', icon: 'message-circle', target_count: 1, is_default: false },
    { id: 'minta-maaf', name: 'Minta & Memberi Maaf', category: 'sosial', icon: 'heart-handshake', target_count: 1, is_default: false },
    { id: 'bersikap-ramah', name: 'Bersikap Ramah', category: 'sosial', icon: 'smile', target_count: 1, is_default: false },
  ],
  finansial: [
    { id: 'catat-pengeluaran', name: 'Catat Pengeluaran', category: 'finansial', icon: 'receipt', target_count: 1, is_default: false },
    { id: 'nabung', name: 'Nabung', category: 'finansial', icon: 'piggy-bank', target_count: 1, is_default: false },
    { id: 'sedekah-rutin', name: 'Sedekah Rutin', category: 'finansial', icon: 'coins', target_count: 1, is_default: false },
    { id: 'no-impulsif', name: 'Hindari Belanja Impulsif', category: 'finansial', icon: 'ban', target_count: 1, is_default: false },
    { id: 'review-keuangan', name: 'Review Keuangan', category: 'finansial', icon: 'chart-bar', target_count: 1, is_default: false },
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
