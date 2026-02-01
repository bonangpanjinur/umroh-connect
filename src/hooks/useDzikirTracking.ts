import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface DzikirType {
  id: string;
  name: string;
  name_arabic: string | null;
  description: string | null;
  default_target: number;
  category: string;
  icon: string | null;
  is_active: boolean;
  priority: number;
}

interface DzikirLog {
  id: string;
  user_id: string;
  dzikir_type_id: string | null;
  log_date: string;
  count: number;
  target_count: number;
  session_id: string | null;
  completed_at: string | null;
  created_at: string;
}

// Fetch all dzikir types (admin-managed)
export const useDzikirTypes = (onlyActive = true) => {
  return useQuery({
    queryKey: ['dzikir-types', onlyActive],
    queryFn: async (): Promise<DzikirType[]> => {
      let query = (supabase as any)
        .from('dzikir_types')
        .select('*')
        .order('priority', { ascending: false });

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DzikirType[];
    },
  });
};

// Admin: Create dzikir type
export const useCreateDzikirType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dzikirType: Partial<DzikirType>) => {
      const { data, error } = await (supabase as any)
        .from('dzikir_types')
        .insert(dzikirType)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dzikir-types'] });
    },
  });
};

// Admin: Update dzikir type
export const useUpdateDzikirType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DzikirType> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('dzikir_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dzikir-types'] });
    },
  });
};

// Admin: Delete dzikir type
export const useDeleteDzikirType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dzikir_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dzikir-types'] });
    },
  });
};

// Fetch user's dzikir logs
export const useDzikirLogs = (userId: string | undefined, startDate?: string, endDate?: string) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const start = startDate || format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const end = endDate || today;

  return useQuery({
    queryKey: ['dzikir-logs', userId, start, end],
    queryFn: async (): Promise<DzikirLog[]> => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from('user_dzikir_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DzikirLog[];
    },
    enabled: !!userId,
  });
};

// Get today's dzikir logs
export const useTodayDzikirLogs = (userId: string | undefined) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useDzikirLogs(userId, today, today);
};

// Log dzikir from Tasbih Digital
export const useLogDzikir = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (log: {
      userId: string;
      dzikirTypeId?: string;
      count: number;
      targetCount?: number;
      sessionId?: string;
    }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const isCompleted = log.count >= (log.targetCount || 33);

      const { data, error } = await (supabase as any)
        .from('user_dzikir_logs')
        .insert({
          user_id: log.userId,
          dzikir_type_id: log.dzikirTypeId,
          log_date: today,
          count: log.count,
          target_count: log.targetCount || 33,
          session_id: log.sessionId,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dzikir-logs', variables.userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal menyimpan dzikir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Dzikir statistics
export const useDzikirStats = (userId: string | undefined) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  
  const { data: logs } = useDzikirLogs(userId, weekAgo, today);
  const { data: types } = useDzikirTypes();

  const statsByType: Record<string, { name: string; nameArabic: string | null; totalCount: number; sessions: number }> = {};
  
  let totalDzikirToday = 0;
  let totalDzikirWeek = 0;

  if (logs && types) {
    logs.forEach(log => {
      totalDzikirWeek += log.count;
      
      if (log.log_date === today) {
        totalDzikirToday += log.count;
      }

      if (log.dzikir_type_id) {
        if (!statsByType[log.dzikir_type_id]) {
          const typeInfo = types.find(t => t.id === log.dzikir_type_id);
          statsByType[log.dzikir_type_id] = {
            name: typeInfo?.name || 'Unknown',
            nameArabic: typeInfo?.name_arabic || null,
            totalCount: 0,
            sessions: 0,
          };
        }
        statsByType[log.dzikir_type_id].totalCount += log.count;
        statsByType[log.dzikir_type_id].sessions++;
      }
    });
  }

  return {
    totalDzikirToday,
    totalDzikirWeek,
    statsByType: Object.values(statsByType).sort((a, b) => b.totalCount - a.totalCount),
    sessionsToday: logs?.filter(l => l.log_date === today).length || 0,
  };
};
