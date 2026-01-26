import { useQuery } from '@tanstack/react-query';

// Using Al-Quran Cloud API (free, no key required)
const API_BASE = 'https://api.alquran.cloud/v1';

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export interface Translation {
  number: number;
  text: string;
  numberInSurah: number;
}

// Fetch list of all surahs
export const useSurahList = () => {
  return useQuery({
    queryKey: ['quran-surah-list'],
    queryFn: async (): Promise<Surah[]> => {
      const response = await fetch(`${API_BASE}/surah`);
      if (!response.ok) throw new Error('Failed to fetch surah list');
      const data = await response.json();
      return data.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });
};

// Fetch a specific surah with Arabic text
export const useSurahArabic = (surahNumber: number | null) => {
  return useQuery({
    queryKey: ['quran-surah-arabic', surahNumber],
    queryFn: async (): Promise<SurahDetail> => {
      if (!surahNumber) throw new Error('Surah number required');
      const response = await fetch(`${API_BASE}/surah/${surahNumber}`);
      if (!response.ok) throw new Error('Failed to fetch surah');
      const data = await response.json();
      return data.data;
    },
    enabled: !!surahNumber,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// Fetch Indonesian translation
export const useSurahTranslation = (surahNumber: number | null, edition = 'id.indonesian') => {
  return useQuery({
    queryKey: ['quran-surah-translation', surahNumber, edition],
    queryFn: async (): Promise<SurahDetail> => {
      if (!surahNumber) throw new Error('Surah number required');
      const response = await fetch(`${API_BASE}/surah/${surahNumber}/${edition}`);
      if (!response.ok) throw new Error('Failed to fetch translation');
      const data = await response.json();
      return data.data;
    },
    enabled: !!surahNumber,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// Fetch audio for a surah
export const useSurahAudio = (surahNumber: number | null, reciter = 'ar.alafasy') => {
  return useQuery({
    queryKey: ['quran-surah-audio', surahNumber, reciter],
    queryFn: async () => {
      if (!surahNumber) throw new Error('Surah number required');
      const response = await fetch(`${API_BASE}/surah/${surahNumber}/${reciter}`);
      if (!response.ok) throw new Error('Failed to fetch audio');
      const data = await response.json();
      return data.data;
    },
    enabled: !!surahNumber,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// Search ayahs
export const useSearchQuran = (query: string) => {
  return useQuery({
    queryKey: ['quran-search', query],
    queryFn: async () => {
      if (!query || query.length < 3) return { matches: [] };
      const response = await fetch(`${API_BASE}/search/${encodeURIComponent(query)}/all/id.indonesian`);
      if (!response.ok) throw new Error('Failed to search');
      const data = await response.json();
      return data.data;
    },
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Popular Juz list
export const JUZ_LIST = [
  { number: 1, name: "Juz 1", startSurah: "Al-Fatihah", startAyah: 1 },
  { number: 2, name: "Juz 2", startSurah: "Al-Baqarah", startAyah: 142 },
  { number: 3, name: "Juz 3", startSurah: "Al-Baqarah", startAyah: 253 },
  { number: 30, name: "Juz Amma", startSurah: "An-Naba", startAyah: 1 },
];

// Short surahs for quick reading (commonly recited)
export const POPULAR_SURAHS = [
  { number: 1, name: "Al-Fatihah" },
  { number: 36, name: "Yasin" },
  { number: 55, name: "Ar-Rahman" },
  { number: 67, name: "Al-Mulk" },
  { number: 78, name: "An-Naba" },
  { number: 112, name: "Al-Ikhlas" },
  { number: 113, name: "Al-Falaq" },
  { number: 114, name: "An-Nas" },
];