import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { coreApi } from '@/lib/coreApi';

export const useQuranStats = () => useQuery({
  queryKey: ['quran-admin-stats', 'core'],
  queryFn: () => coreApi.getQuranAdminStats(),
});

export const useSyncLogs = () => useQuery({
  queryKey: ['quran-sync-logs', 'core'],
  queryFn: () => coreApi.listQuranSyncLogs(),
});

export const useTriggerSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mode, surah_number }: { mode: 'full' | 'surah'; surah_number?: number }) => coreApi.triggerQuranSync(mode, surah_number),
    onSuccess: (data: any) => {
      toast.success(`Sinkronisasi selesai: ${data?.ayahs_synced || 0} ayat dari ${data?.surahs_synced || 0} surat`);
      void queryClient.invalidateQueries({ queryKey: ['quran-admin-stats', 'core'] });
      void queryClient.invalidateQueries({ queryKey: ['quran-sync-logs', 'core'] });
      void queryClient.invalidateQueries({ queryKey: ['quran-local'] });
    },
    onError: (err: any) => toast.error(`Sinkronisasi gagal: ${err.message}`),
  });
};

export const useQuranAyahsList = (surahNumber: number | null) => useQuery({
  queryKey: ['quran-admin-ayahs', 'core', surahNumber],
  queryFn: () => surahNumber ? coreApi.listQuranAyahs(surahNumber) : [],
  enabled: !!surahNumber,
});

export const useUpdateAyah = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, arabic_text, translation_id }: { id: string; arabic_text: string; translation_id: string }) => coreApi.updateQuranAyah(id, { arabic_text, translation_id }),
    onSuccess: () => {
      toast.success('Ayat berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: ['quran-admin-ayahs', 'core'] });
      void queryClient.invalidateQueries({ queryKey: ['quran-local'] });
    },
    onError: (err: any) => toast.error(`Gagal memperbarui: ${err.message}`),
  });
};
