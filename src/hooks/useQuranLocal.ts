import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSurahArabic, useSurahTranslation, SurahDetail } from './useQuranAPI';

export const useQuranLocal = (surahNumber: number | null) => {
  const localQuery = useQuery({
    queryKey: ['quran-local', surahNumber],
    queryFn: async () => {
      if (!surahNumber) return null;
      const { data, error } = await supabase
        .from('quran_ayahs')
        .select('*')
        .eq('surah_number', surahNumber)
        .order('ayah_number');
      if (error) throw error;
      return data && data.length > 0 ? data : null;
    },
    enabled: !!surahNumber,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const hasLocal = !!localQuery.data;

  // Fallback to API when no local data
  const arabicFallback = useSurahArabic(!hasLocal && !localQuery.isLoading ? surahNumber : null);
  const translationFallback = useSurahTranslation(!hasLocal && !localQuery.isLoading ? surahNumber : null);

  if (localQuery.isLoading) {
    return { isLoading: true, surahArabic: null, surahTranslation: null, source: 'loading' as const };
  }

  if (hasLocal) {
    // Transform local data to match SurahDetail shape
    const rows = localQuery.data!;
    const arabicDetail: SurahDetail = {
      number: surahNumber!,
      name: '',
      englishName: '',
      englishNameTranslation: '',
      revelationType: '',
      numberOfAyahs: rows.length,
      ayahs: rows.map(r => ({
        number: r.ayah_global || 0,
        text: r.arabic_text,
        numberInSurah: r.ayah_number,
        juz: r.juz || 1,
        manzil: 0,
        page: r.page || 0,
        ruku: 0,
        hizbQuarter: 0,
        sajda: false,
      })),
    };

    const translationDetail: SurahDetail = {
      ...arabicDetail,
      ayahs: rows.map(r => ({
        number: r.ayah_global || 0,
        text: r.translation_id || '',
        numberInSurah: r.ayah_number,
        juz: r.juz || 1,
        manzil: 0,
        page: r.page || 0,
        ruku: 0,
        hizbQuarter: 0,
        sajda: false,
      })),
    };

    return { isLoading: false, surahArabic: arabicDetail, surahTranslation: translationDetail, source: 'local' as const };
  }

  // Fallback to API
  return {
    isLoading: arabicFallback.isLoading || translationFallback.isLoading,
    surahArabic: arabicFallback.data || null,
    surahTranslation: translationFallback.data || null,
    source: 'api' as const,
  };
};
