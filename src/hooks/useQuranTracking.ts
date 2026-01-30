import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface QuranSurah {
  id: number;
  number: number;
  name: string;
  name_arabic: string;
  total_verses: number;
  juz_start: number | null;
}

interface QuranLog {
  id: string;
  user_id: string;
  log_date: string;
  surah_number: number;
  start_verse: number;
  end_verse: number;
  pages_read: number | null;
  juz_number: number | null;
  notes: string | null;
  created_at: string;
}

// Fetch all surahs
export const useQuranSurahs = () => {
  return useQuery({
    queryKey: ['quran-surahs'],
    queryFn: async (): Promise<QuranSurah[]> => {
      const { data, error } = await (supabase as any)
        .from('quran_surahs')
        .select('*')
        .order('number', { ascending: true });

      if (error) throw error;
      return data as QuranSurah[];
    },
    staleTime: Infinity, // Surahs don't change
  });
};

// Fetch user's quran logs for a date range
export const useQuranLogs = (userId: string | undefined, startDate?: string, endDate?: string) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const start = startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate || today;

  return useQuery({
    queryKey: ['quran-logs', userId, start, end],
    queryFn: async (): Promise<QuranLog[]> => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from('user_quran_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('log_date', { ascending: false });

      if (error) throw error;
      return data as QuranLog[];
    },
    enabled: !!userId,
  });
};

// Get today's logs
export const useTodayQuranLogs = (userId: string | undefined) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useQuranLogs(userId, today, today);
};

// Add quran reading log
export const useAddQuranLog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (log: {
      userId: string;
      surahNumber: number;
      startVerse: number;
      endVerse: number;
      pagesRead?: number;
      juzNumber?: number;
      notes?: string;
    }) => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await (supabase as any)
        .from('user_quran_logs')
        .insert({
          user_id: log.userId,
          log_date: today,
          surah_number: log.surahNumber,
          start_verse: log.startVerse,
          end_verse: log.endVerse,
          pages_read: log.pagesRead,
          juz_number: log.juzNumber,
          notes: log.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quran-logs', variables.userId] });
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
      const { error } = await (supabase as any)
        .from('user_quran_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quran-logs', variables.userId] });
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

// Stats for Quran reading
export const useQuranStats = (userId: string | undefined) => {
  const ramadhanStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const { data: logs } = useQuranLogs(userId, ramadhanStart);
  const { data: surahs } = useQuranSurahs();

  const stats = {
    totalVerses: 0,
    totalPages: 0,
    uniqueSurahs: new Set<number>(),
    daysRead: new Set<string>(),
  };

  if (logs && surahs) {
    logs.forEach(log => {
      stats.totalVerses += (log.end_verse - log.start_verse + 1);
      if (log.pages_read) stats.totalPages += log.pages_read;
      stats.uniqueSurahs.add(log.surah_number);
      stats.daysRead.add(log.log_date);
    });
  }

  return {
    totalVerses: stats.totalVerses,
    totalPages: Math.round(stats.totalPages * 10) / 10,
    uniqueSurahs: stats.uniqueSurahs.size,
    daysRead: stats.daysRead.size,
    estimatedJuz: Math.floor(stats.totalVerses / 200), // ~200 verses per juz average
  };
};
