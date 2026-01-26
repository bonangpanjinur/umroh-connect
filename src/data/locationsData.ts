// Important locations data for Umroh pilgrimage

export type LocationCategory = 'masjid' | 'miqat' | 'ziarah' | 'landmark' | 'hotel';

export interface Location {
  id: string;
  name: string;
  nameArabic: string;
  category: LocationCategory;
  city: 'Makkah' | 'Madinah' | 'Other';
  latitude: number;
  longitude: number;
  description: string;
  tips?: string;
  icon: string;
}

export const locationsData: Location[] = [
  // Makkah - Main Sites
  {
    id: 'masjidil-haram',
    name: 'Masjidil Haram',
    nameArabic: 'المسجد الحرام',
    category: 'masjid',
    city: 'Makkah',
    latitude: 21.4225,
    longitude: 39.8262,
    description: 'Masjid suci tempat Ka\'bah berada. Pusat ibadah umroh dan haji.',
    tips: 'Datang lebih awal untuk sholat berjamaah. Bawa air zamzam.',
    icon: 'mosque'
  },
  {
    id: 'kabah',
    name: 'Ka\'bah',
    nameArabic: 'الكعبة',
    category: 'landmark',
    city: 'Makkah',
    latitude: 21.4225,
    longitude: 39.8262,
    description: 'Rumah Allah yang menjadi kiblat umat Islam sedunia.',
    tips: 'Tawaf dimulai dari Hajar Aswad, berlawanan arah jarum jam.',
    icon: 'kaaba'
  },
  {
    id: 'safa-marwah',
    name: 'Safa & Marwah',
    nameArabic: 'الصفا والمروة',
    category: 'landmark',
    city: 'Makkah',
    latitude: 21.4234,
    longitude: 39.8269,
    description: 'Dua bukit tempat Sa\'i dilakukan, sekarang berada dalam Masjidil Haram.',
    tips: 'Mulai dari Safa, akhiri di Marwah. Total 7 putaran.',
    icon: 'mountain'
  },
  {
    id: 'maqam-ibrahim',
    name: 'Maqam Ibrahim',
    nameArabic: 'مقام إبراهيم',
    category: 'landmark',
    city: 'Makkah',
    latitude: 21.4225,
    longitude: 39.8264,
    description: 'Batu tempat Nabi Ibrahim berdiri saat membangun Ka\'bah.',
    tips: 'Sholat 2 rakaat sunnah tawaf di belakang Maqam Ibrahim.',
    icon: 'landmark'
  },
  {
    id: 'hajar-aswad',
    name: 'Hajar Aswad',
    nameArabic: 'الحجر الأسود',
    category: 'landmark',
    city: 'Makkah',
    latitude: 21.4224,
    longitude: 39.8263,
    description: 'Batu hitam dari surga, titik awal dan akhir tawaf.',
    tips: 'Jika tidak bisa menyentuh, cukup isyaratkan tangan dan ucapkan takbir.',
    icon: 'gem'
  },
  {
    id: 'zamzam',
    name: 'Sumur Zamzam',
    nameArabic: 'بئر زمزم',
    category: 'landmark',
    city: 'Makkah',
    latitude: 21.4226,
    longitude: 39.8265,
    description: 'Sumber air suci yang muncul untuk Hajar dan Ismail.',
    tips: 'Berdoa saat minum air zamzam. Boleh dibawa pulang.',
    icon: 'droplet'
  },

  // Miqat
  {
    id: 'miqat-yalamlam',
    name: 'Miqat Yalamlam',
    nameArabic: 'يلملم',
    category: 'miqat',
    city: 'Other',
    latitude: 20.5519,
    longitude: 39.8503,
    description: 'Miqat untuk jamaah dari arah Yemen dan Indonesia (via laut).',
    tips: 'Niat ihram sebelum melewati batas miqat.',
    icon: 'map-pin'
  },
  {
    id: 'miqat-juhfah',
    name: 'Miqat Juhfah (Rabigh)',
    nameArabic: 'الجحفة',
    category: 'miqat',
    city: 'Other',
    latitude: 22.7208,
    longitude: 39.0917,
    description: 'Miqat untuk jamaah dari arah Mesir, Syam, dan Maghribi.',
    tips: 'Jamaah Indonesia via Madinah biasanya ihram di Bir Ali.',
    icon: 'map-pin'
  },
  {
    id: 'miqat-bir-ali',
    name: 'Miqat Bir Ali (Dzulhulaifah)',
    nameArabic: 'ذو الحليفة',
    category: 'miqat',
    city: 'Madinah',
    latitude: 24.4136,
    longitude: 39.5436,
    description: 'Miqat untuk jamaah dari Madinah. Miqat terjauh dari Makkah.',
    tips: 'Ada masjid untuk sholat dan niat ihram sebelum berangkat ke Makkah.',
    icon: 'map-pin'
  },
  {
    id: 'miqat-qarn',
    name: 'Miqat Qarn al-Manazil',
    nameArabic: 'قرن المنازل',
    category: 'miqat',
    city: 'Other',
    latitude: 21.6167,
    longitude: 40.4167,
    description: 'Miqat untuk jamaah dari arah Najd dan negara-negara Teluk.',
    tips: 'Dikenal juga sebagai As-Sail Al-Kabir.',
    icon: 'map-pin'
  },

  // Madinah
  {
    id: 'masjid-nabawi',
    name: 'Masjid Nabawi',
    nameArabic: 'المسجد النبوي',
    category: 'masjid',
    city: 'Madinah',
    latitude: 24.4672,
    longitude: 39.6112,
    description: 'Masjid Nabi Muhammad SAW. Sholat di sini bernilai 1000x lipat.',
    tips: 'Kunjungi Raudhah dan makam Nabi. Datang pagi untuk antrian lebih singkat.',
    icon: 'mosque'
  },
  {
    id: 'raudhah',
    name: 'Raudhah',
    nameArabic: 'الروضة',
    category: 'landmark',
    city: 'Madinah',
    latitude: 24.4673,
    longitude: 39.6113,
    description: 'Taman surga antara mimbar dan makam Nabi SAW.',
    tips: 'Area ini sangat ramai. Ikuti jadwal kunjungan yang ditentukan.',
    icon: 'flower'
  },
  {
    id: 'makam-nabi',
    name: 'Makam Rasulullah',
    nameArabic: 'قبر الرسول',
    category: 'ziarah',
    city: 'Madinah',
    latitude: 24.4673,
    longitude: 39.6114,
    description: 'Makam Nabi Muhammad SAW, Abu Bakar, dan Umar bin Khattab.',
    tips: 'Ucapkan salam dengan sopan. Jangan berdoa di depan makam.',
    icon: 'star'
  },
  {
    id: 'baqi',
    name: 'Pemakaman Baqi',
    nameArabic: 'البقيع',
    category: 'ziarah',
    city: 'Madinah',
    latitude: 24.4678,
    longitude: 39.6147,
    description: 'Pemakaman para sahabat dan keluarga Nabi SAW.',
    tips: 'Buka setelah sholat subuh dan ashar. Doakan para sahabat.',
    icon: 'trees'
  },
  {
    id: 'masjid-quba',
    name: 'Masjid Quba',
    nameArabic: 'مسجد قباء',
    category: 'masjid',
    city: 'Madinah',
    latitude: 24.4397,
    longitude: 39.6172,
    description: 'Masjid pertama dalam Islam. Sholat di sini = pahala umroh.',
    tips: 'Sholat 2 rakaat. Bisa dikunjungi kapan saja.',
    icon: 'mosque'
  },
  {
    id: 'masjid-qiblatain',
    name: 'Masjid Qiblatain',
    nameArabic: 'مسجد القبلتين',
    category: 'masjid',
    city: 'Madinah',
    latitude: 24.4803,
    longitude: 39.5917,
    description: 'Masjid tempat turunnya perintah perubahan kiblat.',
    tips: 'Masjid bersejarah, bagus untuk foto.',
    icon: 'mosque'
  },
  {
    id: 'jabal-uhud',
    name: 'Jabal Uhud',
    nameArabic: 'جبل أحد',
    category: 'ziarah',
    city: 'Madinah',
    latitude: 24.5011,
    longitude: 39.6156,
    description: 'Gunung tempat Perang Uhud. Nabi bersabda: "Uhud mencintai kita."',
    tips: 'Kunjungi makam para syuhada Uhud di dekatnya.',
    icon: 'mountain'
  },
  {
    id: 'makam-uhud',
    name: 'Makam Syuhada Uhud',
    nameArabic: 'شهداء أحد',
    category: 'ziarah',
    city: 'Madinah',
    latitude: 24.4989,
    longitude: 39.6128,
    description: 'Tempat peristirahatan 70 syuhada Uhud termasuk Hamzah.',
    tips: 'Doakan para syuhada. Jangan menginjak area makam.',
    icon: 'star'
  }
];

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

// Get category label in Indonesian
export const getCategoryLabel = (category: LocationCategory): string => {
  const labels: Record<LocationCategory, string> = {
    masjid: 'Masjid',
    miqat: 'Miqat',
    ziarah: 'Ziarah',
    landmark: 'Landmark',
    hotel: 'Hotel'
  };
  return labels[category];
};

// Get category color
export const getCategoryColor = (category: LocationCategory): string => {
  const colors: Record<LocationCategory, string> = {
    masjid: 'hsl(var(--primary))',
    miqat: 'hsl(var(--accent))',
    ziarah: 'hsl(142, 76%, 36%)',
    landmark: 'hsl(var(--secondary-foreground))',
    hotel: 'hsl(221, 83%, 53%)'
  };
  return colors[category];
};
