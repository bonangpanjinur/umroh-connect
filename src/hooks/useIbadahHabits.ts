import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, isToday, parseISO } from 'date-fns';

interface IbadahHabit {
  id: string;
  name: string;
  name_arabic: string | null;
  description: string | null;
  category: string;
  icon: string | null;
  target_count: number;
  is_ramadan_specific: boolean;
  is_active: boolean;
  priority: number;
}

interface UserIbadahLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  completed_count: number;
  is_completed: boolean;
  notes: string | null;
}

interface HabitWithProgress extends IbadahHabit {
  todayLog?: UserIbadahLog;
}

// Fetch all active habits
export const useIbadahHabits = (includeRamadan: boolean = true) => {
  return useQuery({
    queryKey: ['ibadah-habits', includeRamadan],
    queryFn: async (): Promise<IbadahHabit[]> => {
      let query = (supabase as any)
        .from('ibadah_habits')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!includeRamadan) {
        query = query.eq('is_ramadan_specific', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IbadahHabit[];
    },
  });
};

// Fetch user's logs for a specific date
export const useUserIbadahLogs = (userId: string | undefined, date: string) => {
  return useQuery({
    queryKey: ['user-ibadah-logs', userId, date],
    queryFn: async (): Promise<UserIbadahLog[]> => {
      if (!userId) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_ibadah_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date);

      if (error) throw error;
      return data as UserIbadahLog[];
    },
    enabled: !!userId,
  });
};

// Combined hook: habits with today's progress
export const useHabitsWithProgress = (userId: string | undefined, includeRamadan: boolean = true) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: habits, isLoading: habitsLoading } = useIbadahHabits(includeRamadan);
  const { data: logs, isLoading: logsLoading } = useUserIbadahLogs(userId, today);

  const habitsWithProgress: HabitWithProgress[] = (habits || []).map(habit => ({
    ...habit,
    todayLog: logs?.find(log => log.habit_id === habit.id),
  }));

  return {
    data: habitsWithProgress,
    isLoading: habitsLoading || logsLoading,
  };
};

// Toggle/update habit completion
export const useToggleHabit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      habitId, 
      isCompleted,
      completedCount = 1,
      targetCount = 1
    }: { 
      userId: string; 
      habitId: string; 
      isCompleted: boolean;
      completedCount?: number;
      targetCount?: number;
    }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (isCompleted) {
        const { error } = await (supabase as any)
          .from('user_ibadah_logs')
          .upsert({
            user_id: userId,
            habit_id: habitId,
            log_date: today,
            completed_count: completedCount,
            is_completed: completedCount >= targetCount,
          }, {
            onConflict: 'user_id,habit_id,log_date'
          });

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('user_ibadah_logs')
          .update({
            completed_count: 0,
            is_completed: false,
          })
          .eq('user_id', userId)
          .eq('habit_id', habitId)
          .eq('log_date', today);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['user-ibadah-logs', variables.userId, today] });
      queryClient.invalidateQueries({ queryKey: ['ibadah-stats', variables.userId] });
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

// Increment habit count (for habits with target > 1)
export const useIncrementHabit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      habitId, 
      currentCount,
      targetCount
    }: { 
      userId: string; 
      habitId: string; 
      currentCount: number;
      targetCount: number;
    }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const newCount = currentCount + 1;
      
      const { error } = await (supabase as any)
        .from('user_ibadah_logs')
        .upsert({
          user_id: userId,
          habit_id: habitId,
          log_date: today,
          completed_count: newCount,
          is_completed: newCount >= targetCount,
        }, {
          onConflict: 'user_id,habit_id,log_date'
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['user-ibadah-logs', variables.userId, today] });
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

// Get statistics for habits
export const useIbadahStats = (userId: string | undefined) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['ibadah-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get this week's logs
      const { data: weekLogs, error } = await (supabase as any)
        .from('user_ibadah_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', weekAgo)
        .lte('log_date', today);

      if (error) throw error;

      // Get total habits count
      const { data: habits } = await (supabase as any)
        .from('ibadah_habits')
        .select('id')
        .eq('is_active', true);

      const totalHabits = habits?.length || 0;
      const todayLogs = (weekLogs as UserIbadahLog[])?.filter(log => log.log_date === today) || [];
      const completedToday = todayLogs.filter(log => log.is_completed).length;

      // Calculate weekly completion rate
      const weeklyCompletions = (weekLogs as UserIbadahLog[])?.filter(log => log.is_completed).length || 0;
      const weeklyPossible = totalHabits * 7;
      const weeklyRate = weeklyPossible > 0 ? Math.round((weeklyCompletions / weeklyPossible) * 100) : 0;

      return {
        totalHabits,
        completedToday,
        todayProgress: totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0,
        weeklyCompletions,
        weeklyRate,
      };
    },
    enabled: !!userId,
  });
};

// Get last 7 days completion data for chart
export const useWeeklyProgress = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['weekly-progress', userId],
    queryFn: async () => {
      if (!userId) return [];

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        days.push({
          date: format(date, 'yyyy-MM-dd'),
          dayName: format(date, 'EEE'),
          isToday: isToday(date),
        });
      }

      const { data: logs, error } = await (supabase as any)
        .from('user_ibadah_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', days[0].date)
        .lte('log_date', days[6].date);

      if (error) throw error;

      return days.map(day => ({
        ...day,
        completedCount: (logs as UserIbadahLog[])?.filter(
          log => log.log_date === day.date && log.is_completed
        ).length || 0,
      }));
    },
    enabled: !!userId,
  });
};
