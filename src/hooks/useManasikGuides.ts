import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ManasikGuide {
  id: string;
  title: string;
  title_arabic: string | null;
  description: string | null;
  content: string;
  category: string;
  order_index: number;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
}

export const useManasikGuides = (category: string = 'umroh') => {
  return useQuery({
    queryKey: ['manasik-guides', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manasik_guides')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ManasikGuide[];
    },
  });
};

export const useAllManasikGuides = () => {
  return useQuery({
    queryKey: ['manasik-guides', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manasik_guides')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ManasikGuide[];
    },
  });
};
