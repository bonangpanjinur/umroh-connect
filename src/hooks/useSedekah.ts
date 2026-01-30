import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

export interface SedekahType {
  id: string;
  name: string;
  name_arabic: string | null;
  icon: string;
  description: string | null;
  category: 'uang' | 'makanan' | 'tenaga' | 'barang' | 'kebaikan';
  is_active: boolean;
  priority: number;
}

export interface SedekahLog {
  id: string;
  user_id: string;
  sedekah_type_id: string | null;
  amount: number;
  description: string | null;
  log_date: string;
  is_subuh_mode: boolean;
  created_at: string;
  sedekah_type?: SedekahType;
}

// Fetch all sedekah types
export const useSedekahTypes = () => {
  return useQuery({
    queryKey: ['sedekah-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sedekah_types')
        .select('*')
        .eq('is_active', true)
        .order('priority');
      
      if (error) throw error;
      return data as SedekahType[];
    },
  });
};

// Fetch user's sedekah logs for current month
export const useSedekahLogs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['sedekah-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('user_sedekah_logs')
        .select(`
          *,
          sedekah_type:sedekah_types(*)
        `)
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      return data as SedekahLog[];
    },
    enabled: !!userId,
  });
};

// Get sedekah stats
export const useSedekahStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['sedekah-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      // Get all logs for this month
      const { data: monthLogs, error } = await supabase
        .from('user_sedekah_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate);
      
      if (error) throw error;
      
      const logs = monthLogs || [];
      const todayLogs = logs.filter(l => l.log_date === today);
      const totalAmount = logs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const todayAmount = todayLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const uniqueDays = new Set(logs.map(l => l.log_date)).size;
      const subuhCount = logs.filter(l => l.is_subuh_mode).length;
      
      return {
        totalAmount,
        todayAmount,
        totalCount: logs.length,
        todayCount: todayLogs.length,
        uniqueDays,
        subuhCount,
        hasSedekahToday: todayLogs.length > 0,
      };
    },
    enabled: !!userId,
  });
};

// Get weekly sedekah data for chart
export const useWeeklySedekah = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['weekly-sedekah', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        days.push({
          date: format(date, 'yyyy-MM-dd'),
          dayName: format(date, 'EEE'),
          isToday: i === 0,
        });
      }
      
      const startDate = days[0].date;
      const endDate = days[days.length - 1].date;
      
      const { data, error } = await supabase
        .from('user_sedekah_logs')
        .select('log_date, amount')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate);
      
      if (error) throw error;
      
      return days.map(day => {
        const dayLogs = (data || []).filter(l => l.log_date === day.date);
        const totalAmount = dayLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
        return {
          ...day,
          amount: totalAmount,
          count: dayLogs.length,
        };
      });
    },
    enabled: !!userId,
  });
};

// Add sedekah log
export const useAddSedekah = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      sedekahTypeId,
      amount,
      description,
      isSubuhMode = false,
    }: {
      userId: string;
      sedekahTypeId: string;
      amount?: number;
      description?: string;
      isSubuhMode?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_sedekah_logs')
        .insert({
          user_id: userId,
          sedekah_type_id: sedekahTypeId,
          amount: amount || 0,
          description,
          is_subuh_mode: isSubuhMode,
          log_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedekah-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sedekah-stats'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-sedekah'] });
      queryClient.invalidateQueries({ queryKey: ['ramadan-dashboard'] });
    },
  });
};

// Delete sedekah log
export const useDeleteSedekah = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('user_sedekah_logs')
        .delete()
        .eq('id', logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedekah-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sedekah-stats'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-sedekah'] });
      queryClient.invalidateQueries({ queryKey: ['ramadan-dashboard'] });
    },
  });
};
