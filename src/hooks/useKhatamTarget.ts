import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface KhatamTarget {
  id: string;
  user_id: string;
  target_date: string;
  pages_per_day: number;
  ayat_per_day: number;
  is_active: boolean;
  created_at: string;
}

const TOTAL_QURAN_PAGES = 604;
const TOTAL_QURAN_AYAT = 6236;

export const useKhatamTarget = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: target, isLoading } = useQuery({
    queryKey: ['khatam-target', user?.id],
    queryFn: async (): Promise<KhatamTarget | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('quran_khatam_targets' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) return null;
      return data as unknown as KhatamTarget;
    },
    enabled: !!user?.id,
  });

  const setTarget = useMutation({
    mutationFn: async (params: { targetDate: string; currentAyat?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const now = new Date();
      const targetDate = new Date(params.targetDate);
      const daysLeft = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      const remainingAyat = TOTAL_QURAN_AYAT - (params.currentAyat || 0);
      const remainingPages = TOTAL_QURAN_PAGES - Math.floor(((params.currentAyat || 0) / TOTAL_QURAN_AYAT) * TOTAL_QURAN_PAGES);
      
      const ayatPerDay = Math.ceil(remainingAyat / daysLeft);
      const pagesPerDay = parseFloat((remainingPages / daysLeft).toFixed(1));

      // Deactivate existing targets
      await supabase
        .from('quran_khatam_targets' as any)
        .update({ is_active: false } as any)
        .eq('user_id', user.id);

      const { data, error } = await supabase
        .from('quran_khatam_targets' as any)
        .insert({
          user_id: user.id,
          target_date: params.targetDate,
          pages_per_day: pagesPerDay,
          ayat_per_day: ayatPerDay,
          is_active: true,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatam-target', user?.id] });
      toast({ title: 'Target Khatam Disimpan! 🎯', description: 'Semoga dimudahkan mencapai target' });
    },
    onError: (err: Error) => {
      toast({ title: 'Gagal menyimpan target', description: err.message, variant: 'destructive' });
    },
  });

  const removeTarget = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      await supabase
        .from('quran_khatam_targets' as any)
        .update({ is_active: false } as any)
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatam-target', user?.id] });
    },
  });

  // Calculate status
  const getStatus = (totalAyatRead: number) => {
    if (!target) return null;
    const now = new Date();
    const targetDate = new Date(target.target_date);
    const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const progressPercent = (totalAyatRead / TOTAL_QURAN_AYAT) * 100;
    
    const createdAt = new Date(target.created_at);
    const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const expectedProgress = (elapsedDays / totalDays) * 100;
    
    const isOnTrack = progressPercent >= expectedProgress * 0.9;
    
    return { daysLeft, progressPercent, expectedProgress, isOnTrack, totalAyatRead, totalAyat: TOTAL_QURAN_AYAT };
  };

  return { target, isLoading, setTarget, removeTarget, getStatus, TOTAL_QURAN_PAGES, TOTAL_QURAN_AYAT };
};
