import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

export interface ExerciseType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  intensity: 'ringan' | 'sedang' | 'berat';
  recommended_time: 'sebelum_berbuka' | 'setelah_tarawih' | 'setelah_sahur' | 'kapan_saja';
  duration_minutes: number;
  is_ramadan_friendly: boolean;
  is_active: boolean;
  priority: number;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  exercise_type_id: string | null;
  duration_minutes: number;
  intensity: string;
  notes: string | null;
  log_date: string;
  time_of_day: string;
  created_at: string;
  exercise_type?: ExerciseType;
}

// Fetch all exercise types
export const useExerciseTypes = () => {
  return useQuery({
    queryKey: ['exercise-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_types')
        .select('*')
        .eq('is_active', true)
        .order('priority');
      
      if (error) throw error;
      return data as ExerciseType[];
    },
  });
};

// Fetch user's exercise logs for current month
export const useExerciseLogs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['exercise-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('user_exercise_logs')
        .select(`
          *,
          exercise_type:exercise_types(*)
        `)
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      return data as ExerciseLog[];
    },
    enabled: !!userId,
  });
};

// Get exercise stats
export const useExerciseStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['exercise-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const { data: monthLogs, error } = await supabase
        .from('user_exercise_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate);
      
      if (error) throw error;
      
      const logs = monthLogs || [];
      const todayLogs = logs.filter(l => l.log_date === today);
      const totalMinutes = logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
      const todayMinutes = todayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
      const uniqueDays = new Set(logs.map(l => l.log_date)).size;
      
      return {
        totalMinutes,
        todayMinutes,
        totalSessions: logs.length,
        todaySessions: todayLogs.length,
        uniqueDays,
        hasExerciseToday: todayLogs.length > 0,
      };
    },
    enabled: !!userId,
  });
};

// Get weekly exercise data for chart
export const useWeeklyExercise = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['weekly-exercise', userId],
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
        .from('user_exercise_logs')
        .select('log_date, duration_minutes')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate);
      
      if (error) throw error;
      
      return days.map(day => {
        const dayLogs = (data || []).filter(l => l.log_date === day.date);
        const totalMinutes = dayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
        return {
          ...day,
          minutes: totalMinutes,
          count: dayLogs.length,
        };
      });
    },
    enabled: !!userId,
  });
};

// Add exercise log
export const useAddExercise = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      exerciseTypeId,
      durationMinutes,
      intensity = 'ringan',
      notes,
      timeOfDay = 'setelah_tarawih',
    }: {
      userId: string;
      exerciseTypeId: string;
      durationMinutes: number;
      intensity?: string;
      notes?: string;
      timeOfDay?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_exercise_logs')
        .insert({
          user_id: userId,
          exercise_type_id: exerciseTypeId,
          duration_minutes: durationMinutes,
          intensity,
          notes,
          time_of_day: timeOfDay,
          log_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-logs'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-stats'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-exercise'] });
      queryClient.invalidateQueries({ queryKey: ['ramadan-dashboard'] });
    },
  });
};

// Delete exercise log
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('user_exercise_logs')
        .delete()
        .eq('id', logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-logs'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-stats'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-exercise'] });
      queryClient.invalidateQueries({ queryKey: ['ramadan-dashboard'] });
    },
  });
};

// Get recommended exercise based on time
export const getRecommendedExercise = (hour: number): { intensity: string; message: string } => {
  if (hour >= 16 && hour < 18) {
    return {
      intensity: 'ringan',
      message: '🌅 Sebelum berbuka: Olahraga ringan saja ya, jaga stamina!',
    };
  } else if (hour >= 20 && hour < 23) {
    return {
      intensity: 'sedang',
      message: '🌙 Setelah tarawih: Waktu ideal untuk olahraga sedang!',
    };
  } else if (hour >= 3 && hour < 5) {
    return {
      intensity: 'ringan',
      message: '☀️ Setelah sahur: Stretching ringan untuk memulai hari!',
    };
  }
  return {
    intensity: 'ringan',
    message: '💪 Tetap jaga kesehatan dengan olahraga ringan!',
  };
};
