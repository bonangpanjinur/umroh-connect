export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TimelinePhase {
  id: string;
  name: string;
  label: string;
  description: string;
  daysFromDeparture: number | null; // null for "during" and "after"
  type: 'before' | 'during' | 'after';
  tasks: TimelineTask[];
  color: string;
}

export const timelinePhases: TimelinePhase[] = [
  {
    id: 'h-30',
    name: 'H-30',
    label: '30 Hari Sebelum',
    description: 'Persiapan awal dokumen dan administrasi',
    daysFromDeparture: 30,
    type: 'before',
    color: 'bg-blue-500',
    tasks: [
      {
        id: 'h30-1',
        title: 'Cek Masa Berlaku Paspor',
        description: 'Pastikan paspor masih berlaku minimal 8 bulan dari tanggal keberangkatan',
        completed: true,
        priority: 'high',
      },
      {
        id: 'h30-2',
        title: 'Foto 4x6 Latar Putih',
        description: 'Siapkan foto dengan latar belakang putih untuk keperluan visa',
        completed: true,
        priority: 'high',
      },
      {
        id: 'h30-3',
        title: 'Vaksinasi Meningitis',
        description: 'Lakukan vaksinasi meningitis di klinik kesehatan resmi',
        completed: false,
        priority: 'high',
      },
      {
        id: 'h30-4',
        title: 'Daftar Manasik',
        description: 'Konfirmasi kehadiran untuk manasik umroh bersama travel',
        completed: false,
        priority: 'medium',
      },
    ],
  },
  {
    id: 'h-7',
    name: 'H-7',
    label: '7 Hari Sebelum',
    description: 'Persiapan perlengkapan dan hafalan doa',
    daysFromDeparture: 7,
    type: 'before',
    color: 'bg-primary',
    tasks: [
      {
        id: 'h7-1',
        title: 'Hafal Doa Ihram',
        description: 'Hafalkan niat dan doa ihram untuk umroh',
        completed: false,
        priority: 'high',
      },
      {
        id: 'h7-2',
        title: 'Siapkan Kain Ihram',
        description: 'Pastikan kain ihram sudah bersih dan siap dipakai',
        completed: false,
        priority: 'high',
      },
      {
        id: 'h7-3',
        title: 'Packing Perlengkapan',
        description: 'Siapkan semua perlengkapan ibadah dan pakaian',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'h7-4',
        title: 'Cek Tiket & Jadwal',
        description: 'Konfirmasi tiket pesawat dan jadwal keberangkatan',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'h7-5',
        title: 'Tukar Mata Uang',
        description: 'Tukar rupiah ke riyal Saudi untuk keperluan di sana',
        completed: false,
        priority: 'low',
      },
    ],
  },
  {
    id: 'h-1',
    name: 'H-1',
    label: '1 Hari Sebelum',
    description: 'Persiapan akhir sebelum berangkat',
    daysFromDeparture: 1,
    type: 'before',
    color: 'bg-amber-500',
    tasks: [
      {
        id: 'h1-1',
        title: 'Cek Ulang Dokumen',
        description: 'Pastikan paspor, visa, dan tiket sudah lengkap',
        completed: false,
        priority: 'high',
      },
      {
        id: 'h1-2',
        title: 'Mandi & Potong Kuku',
        description: 'Bersihkan diri, potong kuku, dan rapikan badan',
        completed: false,
        priority: 'high',
      },
      {
        id: 'h1-3',
        title: 'Shalat Istikharah',
        description: 'Lakukan shalat istikharah memohon keberkahan perjalanan',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'h1-4',
        title: 'Pamitan Keluarga',
        description: 'Mohon doa restu dan maaf kepada keluarga',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'h1-5',
        title: 'Charge Semua Device',
        description: 'Isi baterai HP, powerbank, dan perangkat elektronik',
        completed: false,
        priority: 'low',
      },
    ],
  },
  {
    id: 'during',
    name: 'Saat Umroh',
    label: 'Di Tanah Suci',
    description: 'Panduan ibadah selama di Makkah dan Madinah',
    daysFromDeparture: null,
    type: 'during',
    color: 'bg-emerald-500',
    tasks: [
      {
        id: 'during-1',
        title: 'Ihram di Miqat',
        description: 'Kenakan ihram dan niat umroh saat melewati miqat',
        completed: false,
        priority: 'high',
      },
      {
        id: 'during-2',
        title: 'Tawaf 7 Putaran',
        description: 'Lakukan tawaf mengelilingi Ka\'bah sebanyak 7 kali',
        completed: false,
        priority: 'high',
      },
      {
        id: 'during-3',
        title: "Sa'i Safa-Marwah",
        description: "Lakukan sa'i dari Safa ke Marwah 7 kali",
        completed: false,
        priority: 'high',
      },
      {
        id: 'during-4',
        title: 'Tahallul',
        description: 'Potong rambut sebagai tanda selesai umroh',
        completed: false,
        priority: 'high',
      },
      {
        id: 'during-5',
        title: 'Ziarah Madinah',
        description: 'Kunjungi Masjid Nabawi dan makam Rasulullah ﷺ',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'during-6',
        title: 'Shalat di Raudhah',
        description: 'Usahakan shalat di area Raudhah Masjid Nabawi',
        completed: false,
        priority: 'medium',
      },
    ],
  },
  {
    id: 'after',
    name: 'Setelah Umroh',
    label: 'Pulang ke Tanah Air',
    description: 'Menjaga keberkahan setelah umroh',
    daysFromDeparture: null,
    type: 'after',
    color: 'bg-purple-500',
    tasks: [
      {
        id: 'after-1',
        title: 'Shalat Syukur',
        description: 'Lakukan shalat syukur atas kelancaran ibadah',
        completed: false,
        priority: 'high',
      },
      {
        id: 'after-2',
        title: 'Berbagi Oleh-oleh',
        description: 'Bagikan oleh-oleh dan air zamzam kepada keluarga',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'after-3',
        title: 'Istiqomah Ibadah',
        description: 'Jaga konsistensi ibadah seperti saat di Tanah Suci',
        completed: false,
        priority: 'high',
      },
      {
        id: 'after-4',
        title: 'Ceritakan Pengalaman',
        description: 'Berbagi pengalaman spiritual untuk menginspirasi orang lain',
        completed: false,
        priority: 'low',
      },
    ],
  },
];

// Helper to get current phase based on departure date
export const getCurrentPhase = (departureDate?: Date): TimelinePhase | null => {
  if (!departureDate) {
    // Default to H-7 for demo
    return timelinePhases.find(p => p.id === 'h-7') || null;
  }

  const now = new Date();
  const departure = new Date(departureDate);
  const diffTime = departure.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Already departed - check if during or after
    if (diffDays > -14) {
      return timelinePhases.find(p => p.id === 'during') || null;
    }
    return timelinePhases.find(p => p.id === 'after') || null;
  }

  if (diffDays <= 1) return timelinePhases.find(p => p.id === 'h-1') || null;
  if (diffDays <= 7) return timelinePhases.find(p => p.id === 'h-7') || null;
  if (diffDays <= 30) return timelinePhases.find(p => p.id === 'h-30') || null;

  return timelinePhases.find(p => p.id === 'h-30') || null;
};
