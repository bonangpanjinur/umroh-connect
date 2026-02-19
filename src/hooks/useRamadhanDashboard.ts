import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';

// Ramadan 2026 dates (approximate - Hijri calendar)
const RAMADAN_START_2026 = new Date('2026-02-17');
const RAMADAN_END_2026 = new Date('2026-03-18');
const IDUL_FITRI_2026 = new Date('2026-03-19');

// Helper to check if currently Ramadan
export const isCurrentlyRamadan = () => {
  const today = new Date();
  return today >= RAMADAN_START_2026 && today <= RAMADAN_END_2026;
};

export const getRamadanDay = () => {
  const today = new Date();
  return differenceInDays(today, RAMADAN_START_2026) + 1;
};

export const getDaysUntilIdulFitri = () => {
  return Math.max(0, differenceInDays(IDUL_FITRI_2026, new Date()));
};

export interface RamadanDashboardData {
  dayOfRamadan: number;
  totalDays: number;
  isRamadan: boolean;
  isLast10Nights: boolean;
  ibadahProgress: number;
  ibadahCompleted: number;
  ibadahTotal: number;
  sedekahTotal: number;
  sedekahCount: number;
  exerciseMinutes: number;
  exerciseSessions: number;
  bestStreak: number;
  currentStreak: number;
  hasSedekahToday: boolean;
  hasExerciseToday: boolean;
}

export const useRamadanDashboard = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['ramadan-dashboard', userId],
    queryFn: async (): Promise<RamadanDashboardData> => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Calculate Ramadan day
      const dayOfRamadan = differenceInDays(today, RAMADAN_START_2026) + 1;
      const totalDays = differenceInDays(RAMADAN_END_2026, RAMADAN_START_2026) + 1;
      const isRamadan = today >= RAMADAN_START_2026 && today <= RAMADAN_END_2026;
      const isLast10Nights = isRamadan && dayOfRamadan >= 21;
      
      if (!userId) {
        return {
          dayOfRamadan: Math.max(1, Math.min(dayOfRamadan, totalDays)),
          totalDays,
          isRamadan,
          isLast10Nights,
          ibadahProgress: 0,
          ibadahCompleted: 0,
          ibadahTotal: 0,
          sedekahTotal: 0,
          sedekahCount: 0,
          exerciseMinutes: 0,
          exerciseSessions: 0,
          bestStreak: 0,
          currentStreak: 0,
          hasSedekahToday: false,
          hasExerciseToday: false,
        };
      }
      
      // Fetch all data in parallel
      const [ibadahResult, sedekahResult, exerciseResult, streakResult] = await Promise.all([
        // Ibadah progress today
        supabase
          .from('user_ibadah_logs')
          .select('is_completed, habit_id')
          .eq('user_id', userId)
          .eq('log_date', todayStr),
        
        // Sedekah this month
        supabase
          .from('user_sedekah_logs')
          .select('amount, log_date')
          .eq('user_id', userId)
          .gte('log_date', format(RAMADAN_START_2026, 'yyyy-MM-dd'))
          .lte('log_date', format(RAMADAN_END_2026, 'yyyy-MM-dd')),
        
        // Exercise this month
        supabase
          .from('user_exercise_logs')
          .select('duration_minutes, log_date')
          .eq('user_id', userId)
          .gte('log_date', format(RAMADAN_START_2026, 'yyyy-MM-dd'))
          .lte('log_date', format(RAMADAN_END_2026, 'yyyy-MM-dd')),
        
        // Best streak
        supabase
          .from('user_ibadah_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', userId)
          .order('longest_streak', { ascending: false })
          .limit(1),
      ]);
      
      // Get total habits count
      const { data: habitsData } = await supabase
        .from('ibadah_habits')
        .select('id')
        .eq('is_active', true);
      
      const ibadahLogs = ibadahResult.data || [];
      const sedekahLogs = sedekahResult.data || [];
      const exerciseLogs = exerciseResult.data || [];
      const streakData = streakResult.data?.[0];
      
      const ibadahCompleted = ibadahLogs.filter(l => l.is_completed).length;
      const ibadahTotal = habitsData?.length || 10;
      const ibadahProgress = ibadahTotal > 0 ? Math.round((ibadahCompleted / ibadahTotal) * 100) : 0;
      
      const sedekahTotal = sedekahLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const sedekahCount = sedekahLogs.length;
      const hasSedekahToday = sedekahLogs.some(l => l.log_date === todayStr);
      
      const exerciseMinutes = exerciseLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
      const exerciseSessions = exerciseLogs.length;
      const hasExerciseToday = exerciseLogs.some(l => l.log_date === todayStr);
      
      return {
        dayOfRamadan: Math.max(1, Math.min(dayOfRamadan, totalDays)),
        totalDays,
        isRamadan,
        isLast10Nights,
        ibadahProgress,
        ibadahCompleted,
        ibadahTotal,
        sedekahTotal,
        sedekahCount,
        exerciseMinutes,
        exerciseSessions,
        bestStreak: streakData?.longest_streak || 0,
        currentStreak: streakData?.current_streak || 0,
        hasSedekahToday,
        hasExerciseToday,
      };
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });
};

// Motivational quotes for Ramadan
export const ramadanQuotes = [
  { text: 'Barangsiapa berpuasa Ramadan dengan iman dan mengharap pahala, diampuni dosanya yang telah lalu.', source: 'HR. Bukhari & Muslim' },
  { text: 'Sedekah tidak akan mengurangi harta.', source: 'HR. Muslim' },
  { text: 'Sebaik-baik kamu adalah yang mempelajari Al-Quran dan mengajarkannya.', source: 'HR. Bukhari' },
  { text: 'Puasa adalah perisai, maka janganlah berkata kotor dan janganlah bertindak bodoh.', source: 'HR. Bukhari' },
  { text: 'Allah melipatgandakan pahala sedekah 700 kali lipat.', source: 'HR. Bukhari & Muslim' },
  { text: 'Shalat malam Ramadan dengan iman dan ikhlas, diampuni dosa yang telah lalu.', source: 'HR. Bukhari & Muslim' },
  { text: 'Carilah Lailatul Qadar di malam ganjil pada 10 malam terakhir Ramadan.', source: 'HR. Bukhari' },
  { text: 'Doa orang yang berpuasa tidak ditolak.', source: 'HR. Ibnu Majah' },
];

export const getRandomQuote = () => {
  return ramadanQuotes[Math.floor(Math.random() * ramadanQuotes.length)];
};
