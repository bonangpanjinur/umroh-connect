import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuranTip {
  id: string;
  title: string;
  content: string;
  category: string;
  day_number: number | null;
  is_premium: boolean;
  is_active: boolean;
}

export const useQuranTips = () => {
  return useQuery({
    queryKey: ['quran-tips'],
    queryFn: async (): Promise<QuranTip[]> => {
      const { data, error } = await supabase
        .from('quran_tips' as any)
        .select('*')
        .eq('is_active', true)
        .order('day_number', { ascending: true });

      if (error) return [];
      return (data || []) as unknown as QuranTip[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useTodayTip = () => {
  const { data: tips } = useQuranTips();
  
  if (!tips || tips.length === 0) return null;
  
  // Rotate based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % tips.filter(t => !t.is_premium).length;
  const freeTips = tips.filter(t => !t.is_premium);
  
  return freeTips[index] || null;
};
