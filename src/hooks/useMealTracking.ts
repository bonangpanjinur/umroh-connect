import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface MealLog {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: 'sahur' | 'iftar';
  is_skipped: boolean;
  water_glasses: number;
  protein_source: string | null;
  carb_source: string | null;
  vegetables: string | null;
  fruits: string | null;
  notes: string | null;
  is_healthy: boolean;
  created_at: string;
}

type MealType = 'sahur' | 'iftar';

// Fetch meal logs for date range
export const useMealLogs = (userId: string | undefined, startDate?: string, endDate?: string) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const start = startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate || today;

  return useQuery({
    queryKey: ['meal-logs', userId, start, end],
    queryFn: async (): Promise<MealLog[]> => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from('user_meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('log_date', { ascending: false });

      if (error) throw error;
      return data as MealLog[];
    },
    enabled: !!userId,
  });
};

// Get today's meals
export const useTodayMeals = (userId: string | undefined) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useMealLogs(userId, today, today);
};

// Log or update meal
export const useLogMeal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meal: {
      userId: string;
      mealType: MealType;
      isSkipped?: boolean;
      waterGlasses?: number;
      proteinSource?: string;
      carbSource?: string;
      vegetables?: string;
      fruits?: string;
      notes?: string;
    }) => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await (supabase as any)
        .from('user_meal_logs')
        .upsert({
          user_id: meal.userId,
          log_date: today,
          meal_type: meal.mealType,
          is_skipped: meal.isSkipped || false,
          water_glasses: meal.waterGlasses || 0,
          protein_source: meal.proteinSource,
          carb_source: meal.carbSource,
          vegetables: meal.vegetables,
          fruits: meal.fruits,
          notes: meal.notes,
          is_healthy: !meal.isSkipped && (meal.waterGlasses || 0) >= 2,
        }, {
          onConflict: 'user_id,log_date,meal_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs', variables.userId] });
      const mealName = variables.mealType === 'sahur' ? 'Sahur' : 'Berbuka';
      toast({
        title: variables.isSkipped ? `${mealName} di-skip` : `${mealName} tercatat! 🍽️`,
        description: variables.isSkipped 
          ? 'Semoga tetap kuat menjalani puasa'
          : 'Makan sehat, puasa berkah',
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

// Quick skip meal
export const useSkipMeal = () => {
  const logMeal = useLogMeal();

  return {
    ...logMeal,
    mutate: (params: { userId: string; mealType: MealType }) => {
      logMeal.mutate({ ...params, isSkipped: true });
    },
  };
};

// Meal stats
export const useMealStats = (userId: string | undefined) => {
  const ramadhanStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const { data: logs } = useMealLogs(userId, ramadhanStart);

  const stats = {
    totalSahur: 0,
    totalIftar: 0,
    skippedSahur: 0,
    skippedIftar: 0,
    avgWaterGlasses: 0,
    healthyMeals: 0,
  };

  if (logs) {
    let totalWater = 0;
    logs.forEach(log => {
      if (log.meal_type === 'sahur') {
        stats.totalSahur++;
        if (log.is_skipped) stats.skippedSahur++;
      } else {
        stats.totalIftar++;
        if (log.is_skipped) stats.skippedIftar++;
      }
      totalWater += log.water_glasses;
      if (log.is_healthy) stats.healthyMeals++;
    });
    stats.avgWaterGlasses = logs.length > 0 ? Math.round(totalWater / logs.length * 10) / 10 : 0;
  }

  return stats;
};
