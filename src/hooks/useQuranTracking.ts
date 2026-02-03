import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useToggleHabit } from '@/hooks/useIbadahHabits';

export interface QuranSurah {
  id: number;
  number: number;
  name: string;
  name_arabic: string;
  total_verses: number;
  juz_start: number | null;
}

export interface QuranTadarusLog {
  id: string;
  user_id: string;
  read_date: string;
  surah_start: number;
  ayah_start: number;
  surah_end: number;
  ayah_end: number;
  total_verses: number;
  juz_start: number | null;
  juz_end: number | null;
  created_at: string;
}

export interface TadarusStats {
  total_ayat: number;
  hari_tadarus: number;
  progress_juz: number;
  total_surat: number;
}

export interface QuranLastRead {
  user_id: string;
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  updated_at: string;
}

// Fetch all surahs
export const useQuranSurahs = () => {
  return useQuery({
    queryKey: ['quran-surahs'],
    queryFn: async (): Promise<QuranSurah[]> => {
      const { data, error } = await supabase
        .from('quran_surahs' as any)
        .select('*')
        .order('number', { ascending: true });

      if (error) {
        console.error('Error fetching surahs:', error);
        return [];
      }
      return (data || []) as unknown as QuranSurah[];
    },
    staleTime: Infinity,
  });
};

// Fetch user's today quran logs
export const useTodayQuranLogs = (userId: string | undefined) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['quran-logs-today', userId],
    queryFn: async (): Promise<any[]> => {
      if (!userId) return [];

      // First get the logs
      const { data: logs, error: logsError } = await supabase
        .from('quran_tadarus_logs' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('read_date', today)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) return [];

      // Then get surah info for each log
      const surahNumbers = [...new Set(logs.map((l: any) => l.surah_start))];
      const { data: surahs } = await supabase
        .from('quran_surahs' as any)
        .select('*')
        .in('number', surahNumbers);

      // Merge surah data into logs
      return logs.map((log: any) => ({
        ...log,
        quran_surahs: surahs?.find((s: any) => s.number === log.surah_start) || null,
      }));
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
};

// Add quran reading log
export const useAddQuranLog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleHabit = useToggleHabit();

  return useMutation({
    mutationFn: async (log: {
      userId: string;
      surahStart: number;
      ayahStart: number;
      surahEnd: number;
      ayahEnd: number;
      totalVerses: number;
      juzStart?: number;
      juzEnd?: number;
    }) => {
      // 1. Save reading log
      const { data, error } = await supabase
        .from('quran_tadarus_logs' as any)
        .insert({
          user_id: log.userId,
          surah_start: log.surahStart,
          ayah_start: log.ayahStart,
          surah_end: log.surahEnd,
          ayah_end: log.ayahEnd,
          total_verses: log.totalVerses,
          juz_start: log.juzStart || 1,
          juz_end: log.juzEnd || log.juzStart || 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving quran log:', error);
        throw error;
      }

      // 2. Update last read
      const { error: lastReadError } = await supabase
        .from('quran_last_read' as any)
        .upsert({
          user_id: log.userId,
          surah_number: log.surahEnd,
          ayah_number: log.ayahEnd,
          juz_number: log.juzEnd || 1,
          updated_at: new Date().toISOString(),
        });
      
      if (lastReadError) console.error('Error updating last read:', lastReadError);

      // 3. Connect to habit tracker (tilawah habit)
      try {
        await toggleHabit.mutateAsync({
          userId: log.userId,
          habitId: 'tilawah',
          isCompleted: true,
          completedCount: 1,
          targetCount: 1
        });
      } catch (habitError) {
        console.error('Error updating tilawah habit:', habitError);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quran-logs-today', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['quran-stats', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['quran-last-read', variables.userId] });
      toast({
        title: 'Alhamdulillah! 📖',
        description: 'Bacaan Qur\'an berhasil dicatat',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal menyimpan',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Delete quran log
export const useDeleteQuranLog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ logId, userId }: { logId: string; userId: string }) => {
      const { error } = await supabase
        .from('quran_tadarus_logs' as any)
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quran-logs-today', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['quran-stats', variables.userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal menghapus',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Stats for Quran reading using the view
export const useQuranStats = (userId: string | undefined) => {
  const { data: stats } = useQuery({
    queryKey: ['quran-stats', userId],
    queryFn: async (): Promise<TadarusStats | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('v_tadarus_dashboard' as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data as unknown as TadarusStats;
    },
    enabled: !!userId,
  });

  return {
    totalVerses: stats?.total_ayat || 0,
    uniqueSurahs: stats?.total_surat || 0,
    daysRead: stats?.hari_tadarus || 0,
    estimatedJuz: stats?.progress_juz || 0,
  };
};

// Hook for last read
export const useQuranLastRead = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['quran-last-read', userId],
    queryFn: async (): Promise<QuranLastRead | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('quran_last_read' as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data as unknown as QuranLastRead;
    },
    enabled: !!userId,
  });
};
