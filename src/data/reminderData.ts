// Reminder data based on journey phases

export type ReminderPhase = 'H-30' | 'H-7' | 'H-1' | 'during' | 'after';
export type ReminderCategory = 'preparation' | 'ibadah' | 'health' | 'document' | 'packing';
export type ReminderPriority = 'high' | 'medium' | 'low';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  phase: ReminderPhase;
  category: ReminderCategory;
  priority: ReminderPriority;
  daysBeforeDeparture: number; // positive = before, negative = after, 0 = departure day
  icon: string;
  isDefault: boolean;
}

// Default reminders based on journey phases
export const defaultReminders: Reminder[] = [
  // H-30: Persiapan Awal
  {
    id: 'r-001',
    title: 'Cek Masa Berlaku Paspor',
    description: 'Pastikan paspor masih berlaku minimal 6 bulan dari tanggal keberangkatan',
    phase: 'H-30',
    category: 'document',
    priority: 'high',
    daysBeforeDeparture: 30,
    icon: 'file-text',
    isDefault: true
  },
  {
    id: 'r-002',
    title: 'Daftar Vaksinasi Meningitis',
    description: 'Lakukan vaksinasi meningitis di klinik kesehatan yang ditunjuk',
    phase: 'H-30',
    category: 'health',
    priority: 'high',
    daysBeforeDeparture: 28,
    icon: 'syringe',
    isDefault: true
  },
  {
    id: 'r-003',
    title: 'Siapkan Foto untuk Visa',
    description: 'Foto berwarna ukuran 4x6 dengan latar belakang putih',
    phase: 'H-30',
    category: 'document',
    priority: 'medium',
    daysBeforeDeparture: 25,
    icon: 'camera',
    isDefault: true
  },
  {
    id: 'r-004',
    title: 'Mulai Latihan Jalan Kaki',
    description: 'Latihan stamina dengan jalan kaki 2-3 km setiap hari',
    phase: 'H-30',
    category: 'health',
    priority: 'medium',
    daysBeforeDeparture: 30,
    icon: 'footprints',
    isDefault: true
  },
  {
    id: 'r-005',
    title: 'Pelajari Tata Cara Umroh',
    description: 'Mulai mempelajari bacaan dan gerakan manasik umroh',
    phase: 'H-30',
    category: 'ibadah',
    priority: 'high',
    daysBeforeDeparture: 30,
    icon: 'book-open',
    isDefault: true
  },
  
  // H-7: Persiapan Akhir
  {
    id: 'r-006',
    title: 'Siapkan Koper dan Perlengkapan',
    description: 'Pack pakaian ihram, mukena, sajadah, dan perlengkapan pribadi',
    phase: 'H-7',
    category: 'packing',
    priority: 'high',
    daysBeforeDeparture: 7,
    icon: 'luggage',
    isDefault: true
  },
  {
    id: 'r-007',
    title: 'Siapkan Obat-obatan Pribadi',
    description: 'Bawa obat rutin, vitamin, dan P3K dasar',
    phase: 'H-7',
    category: 'health',
    priority: 'high',
    daysBeforeDeparture: 7,
    icon: 'pill',
    isDefault: true
  },
  {
    id: 'r-008',
    title: 'Fotokopi Dokumen Penting',
    description: 'Fotokopi paspor, visa, tiket, dan simpan terpisah dari aslinya',
    phase: 'H-7',
    category: 'document',
    priority: 'high',
    daysBeforeDeparture: 5,
    icon: 'copy',
    isDefault: true
  },
  {
    id: 'r-009',
    title: 'Konfirmasi Jadwal Keberangkatan',
    description: 'Hubungi travel untuk konfirmasi jadwal dan meeting point',
    phase: 'H-7',
    category: 'preparation',
    priority: 'high',
    daysBeforeDeparture: 3,
    icon: 'phone',
    isDefault: true
  },
  {
    id: 'r-010',
    title: 'Hafalkan Doa-doa Manasik',
    description: 'Pastikan sudah hafal doa tawaf, sai, dan doa-doa penting lainnya',
    phase: 'H-7',
    category: 'ibadah',
    priority: 'high',
    daysBeforeDeparture: 7,
    icon: 'book-heart',
    isDefault: true
  },
  {
    id: 'r-011',
    title: 'Tukar Mata Uang',
    description: 'Tukar rupiah ke Riyal Saudi secukupnya',
    phase: 'H-7',
    category: 'preparation',
    priority: 'medium',
    daysBeforeDeparture: 5,
    icon: 'banknote',
    isDefault: true
  },

  // H-1: Hari Terakhir
  {
    id: 'r-012',
    title: 'Cek Ulang Semua Dokumen',
    description: 'Pastikan paspor, visa, tiket, dan dokumen penting ada di tas kabin',
    phase: 'H-1',
    category: 'document',
    priority: 'high',
    daysBeforeDeparture: 1,
    icon: 'clipboard-check',
    isDefault: true
  },
  {
    id: 'r-013',
    title: 'Sholat Istikharah',
    description: 'Lakukan sholat istikharah dan minta restu keluarga',
    phase: 'H-1',
    category: 'ibadah',
    priority: 'high',
    daysBeforeDeparture: 1,
    icon: 'heart',
    isDefault: true
  },
  {
    id: 'r-014',
    title: 'Charge Semua Device',
    description: 'Pastikan HP, powerbank, dan device lain terisi penuh',
    phase: 'H-1',
    category: 'preparation',
    priority: 'medium',
    daysBeforeDeparture: 1,
    icon: 'battery-charging',
    isDefault: true
  },
  {
    id: 'r-015',
    title: 'Siapkan Pakaian Ihram',
    description: 'Taruh pakaian ihram di tempat yang mudah dijangkau',
    phase: 'H-1',
    category: 'packing',
    priority: 'high',
    daysBeforeDeparture: 1,
    icon: 'shirt',
    isDefault: true
  },
  {
    id: 'r-016',
    title: 'Berangkat ke Bandara',
    description: 'Datang 3 jam sebelum jadwal keberangkatan',
    phase: 'H-1',
    category: 'preparation',
    priority: 'high',
    daysBeforeDeparture: 0,
    icon: 'plane',
    isDefault: true
  },

  // During: Saat Umroh
  {
    id: 'r-017',
    title: 'Niat Ihram dari Miqat',
    description: 'Jangan lupa niat ihram saat melewati miqat',
    phase: 'during',
    category: 'ibadah',
    priority: 'high',
    daysBeforeDeparture: 0,
    icon: 'map-pin',
    isDefault: true
  },
  {
    id: 'r-018',
    title: 'Perbanyak Dzikir dan Doa',
    description: 'Manfaatkan waktu di Tanah Suci untuk beribadah',
    phase: 'during',
    category: 'ibadah',
    priority: 'high',
    daysBeforeDeparture: -1,
    icon: 'sparkles',
    isDefault: true
  },
  {
    id: 'r-019',
    title: 'Jaga Kesehatan',
    description: 'Minum air yang cukup dan istirahat teratur',
    phase: 'during',
    category: 'health',
    priority: 'medium',
    daysBeforeDeparture: -1,
    icon: 'heart-pulse',
    isDefault: true
  },

  // After: Setelah Pulang
  {
    id: 'r-020',
    title: 'Sholat Syukur',
    description: 'Lakukan sholat syukur atas kelancaran ibadah umroh',
    phase: 'after',
    category: 'ibadah',
    priority: 'high',
    daysBeforeDeparture: -10,
    icon: 'sparkle',
    isDefault: true
  },
  {
    id: 'r-021',
    title: 'Jaga Amalan Baik',
    description: 'Pertahankan kebiasaan baik yang didapat selama umroh',
    phase: 'after',
    category: 'ibadah',
    priority: 'medium',
    daysBeforeDeparture: -14,
    icon: 'star',
    isDefault: true
  }
];

// Get phase label
export const getPhaseLabel = (phase: ReminderPhase): string => {
  const labels: Record<ReminderPhase, string> = {
    'H-30': 'H-30 Hari',
    'H-7': 'H-7 Hari',
    'H-1': 'H-1 Hari',
    'during': 'Saat Umroh',
    'after': 'Setelah Pulang'
  };
  return labels[phase];
};

// Get category label
export const getCategoryLabel = (category: ReminderCategory): string => {
  const labels: Record<ReminderCategory, string> = {
    preparation: 'Persiapan',
    ibadah: 'Ibadah',
    health: 'Kesehatan',
    document: 'Dokumen',
    packing: 'Perlengkapan'
  };
  return labels[category];
};

// Get priority color
export const getPriorityColor = (priority: ReminderPriority): string => {
  const colors: Record<ReminderPriority, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };
  return colors[priority];
};

// Calculate current phase based on departure date
export const getCurrentPhase = (departureDate: Date | null): ReminderPhase => {
  if (!departureDate) return 'H-30';
  
  const now = new Date();
  const diffTime = departureDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 7) return 'H-30';
  if (diffDays > 1) return 'H-7';
  if (diffDays >= 0) return 'H-1';
  if (diffDays >= -14) return 'during';
  return 'after';
};

// Get reminders for a specific phase
export const getRemindersByPhase = (phase: ReminderPhase): Reminder[] => {
  return defaultReminders.filter(r => r.phase === phase);
};

// Get upcoming reminders based on departure date
export const getUpcomingReminders = (departureDate: Date, limit: number = 5): Reminder[] => {
  const now = new Date();
  const diffDays = Math.ceil((departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get reminders that are due soon (within the next daysBeforeDeparture)
  return defaultReminders
    .filter(r => r.daysBeforeDeparture >= diffDays - 3 && r.daysBeforeDeparture <= diffDays + 1)
    .sort((a, b) => b.daysBeforeDeparture - a.daysBeforeDeparture)
    .slice(0, limit);
};
