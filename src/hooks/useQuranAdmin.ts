import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQuranStats = () => {
  return useQuery({
    queryKey: ['quran-admin-stats'],
    queryFn: async () => {
      // Total ayahs stored
      const { count: totalAyahs } = await supabase
        .from('quran_ayahs')
        .select('*', { count: 'exact', head: true });

      // Distinct surahs with data
      const { data: surahCounts } = await supabase
        .from('quran_ayahs')
        .select('surah_number')
        .order('surah_number');

      const uniqueSurahs = new Set(surahCounts?.map(r => r.surah_number) || []);

      // Per-surah counts
      const surahMap: Record<number, number> = {};
      surahCounts?.forEach(r => {
        surahMap[r.surah_number] = (surahMap[r.surah_number] || 0) + 1;
      });

      return {
        totalAyahs: totalAyahs || 0,
        totalSurahs: uniqueSurahs.size,
        surahCounts: surahMap,
      };
    },
  });
};

export const useSyncLogs = () => {
  return useQuery({
    queryKey: ['quran-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quran_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
};

export const useTriggerSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mode, surah_number }: { mode: 'full' | 'surah'; surah_number?: number }) => {
      const { data, error } = await supabase.functions.invoke('sync-quran-data', {
        body: { mode, surah_number },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sinkronisasi selesai: ${data.ayahs_synced} ayat dari ${data.surahs_synced} surat`);
      queryClient.invalidateQueries({ queryKey: ['quran-admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['quran-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['quran-local'] });
    },
    onError: (err: any) => {
      toast.error('Sinkronisasi gagal: ' + err.message);
    },
  });
};

export const useQuranAyahsList = (surahNumber: number | null) => {
  return useQuery({
    queryKey: ['quran-admin-ayahs', surahNumber],
    queryFn: async () => {
      if (!surahNumber) return [];
      const { data, error } = await supabase
        .from('quran_ayahs')
        .select('*')
        .eq('surah_number', surahNumber)
        .order('ayah_number');
      if (error) throw error;
      return data;
    },
    enabled: !!surahNumber,
  });
};

export const useUpdateAyah = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, arabic_text, translation_id }: { id: string; arabic_text: string; translation_id: string }) => {
      const { error } = await supabase
        .from('quran_ayahs')
        .update({ arabic_text, translation_id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ayat berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['quran-admin-ayahs'] });
      queryClient.invalidateQueries({ queryKey: ['quran-local'] });
    },
    onError: (err: any) => {
      toast.error('Gagal memperbarui: ' + err.message);
    },
  });
};
