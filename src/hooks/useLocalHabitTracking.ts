import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { DefaultHabit, starterPackHabits, HabitCategory } from '@/data/defaultHabits';

const STORAGE_KEYS = {
  HABITS: 'habit_tracker_habits',
  LOGS: 'habit_tracker_logs',
  STREAKS: 'habit_tracker_streaks',
};

interface HabitLog {
  habitId: string;
  date: string;
  completedCount: number;
  isCompleted: boolean;
  timestamp: number;
}

interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

// Initialize default habits for new users
const initializeHabits = (): DefaultHabit[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.HABITS);
  if (stored) {
    return JSON.parse(stored);
  }
  // New user: set starter pack
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(starterPackHabits));
  return starterPackHabits;
};

// Get all logs
const getLogs = (): HabitLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
  return stored ? JSON.parse(stored) : [];
};

// Get all streaks
const getStreaks = (): HabitStreak[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STREAKS);
  return stored ? JSON.parse(stored) : [];
};

export const useLocalHabits = (isRamadhanMode: boolean = false) => {
  const [habits, setHabits] = useState<DefaultHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allHabits = initializeHabits();
    // Filter based on mode
    const filtered = isRamadhanMode 
      ? allHabits 
      : allHabits.filter(h => !h.is_ramadan_specific);
    setHabits(filtered);
    setIsLoading(false);
  }, [isRamadhanMode]);

  const addHabit = useCallback((habit: DefaultHabit) => {
    const allHabits = initializeHabits();
    if (!allHabits.find(h => h.id === habit.id)) {
      const updated = [...allHabits, habit];
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
      setHabits(updated.filter(h => !h.is_ramadan_specific || isRamadhanMode));
    }
  }, [isRamadhanMode]);

  const removeHabit = useCallback((habitId: string) => {
    const allHabits = initializeHabits();
    const updated = allHabits.filter(h => h.id !== habitId);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
    setHabits(updated.filter(h => !h.is_ramadan_specific || isRamadhanMode));
  }, [isRamadhanMode]);

  return { habits, isLoading, addHabit, removeHabit };
};

export const useLocalHabitLogs = () => {
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  const getLogForDate = useCallback((habitId: string, date: string): HabitLog | undefined => {
    return logs.find(l => l.habitId === habitId && l.date === date);
  }, [logs]);

  const getTodayLog = useCallback((habitId: string): HabitLog | undefined => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return getLogForDate(habitId, today);
  }, [getLogForDate]);

  const getAllTodayLogs = useCallback((): HabitLog[] => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return logs.filter(l => l.date === today);
  }, [logs]);

  const toggleHabit = useCallback((habitId: string, targetCount: number = 1) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allLogs = getLogs();
    const existingIndex = allLogs.findIndex(l => l.habitId === habitId && l.date === today);
    
    let updatedLogs: HabitLog[];
    
    if (existingIndex >= 0) {
      const existing = allLogs[existingIndex];
      if (targetCount > 1) {
        // Increment
        const newCount = existing.completedCount + 1;
        updatedLogs = [...allLogs];
        updatedLogs[existingIndex] = {
          ...existing,
          completedCount: newCount,
          isCompleted: newCount >= targetCount,
          timestamp: Date.now(),
        };
      } else {
        // Toggle
        updatedLogs = [...allLogs];
        updatedLogs[existingIndex] = {
          ...existing,
          isCompleted: !existing.isCompleted,
          completedCount: existing.isCompleted ? 0 : 1,
          timestamp: Date.now(),
        };
      }
    } else {
      // New log
      updatedLogs = [...allLogs, {
        habitId,
        date: today,
        completedCount: 1,
        isCompleted: targetCount === 1,
        timestamp: Date.now(),
      }];
    }
    
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
    
    // Update streak
    updateStreak(habitId, today);
  }, []);

  const incrementHabit = useCallback((habitId: string, targetCount: number = 1) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allLogs = getLogs();
    const existingIndex = allLogs.findIndex(l => l.habitId === habitId && l.date === today);
    
    let updatedLogs: HabitLog[];
    
    if (existingIndex >= 0) {
      const existing = allLogs[existingIndex];
      const newCount = Math.min(existing.completedCount + 1, targetCount);
      updatedLogs = [...allLogs];
      updatedLogs[existingIndex] = {
        ...existing,
        completedCount: newCount,
        isCompleted: newCount >= targetCount,
        timestamp: Date.now(),
      };
    } else {
      updatedLogs = [...allLogs, {
        habitId,
        date: today,
        completedCount: 1,
        isCompleted: targetCount === 1,
        timestamp: Date.now(),
      }];
    }
    
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
    updateStreak(habitId, today);
  }, []);

  const decrementHabit = useCallback((habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allLogs = getLogs();
    const existingIndex = allLogs.findIndex(l => l.habitId === habitId && l.date === today);
    
    if (existingIndex >= 0) {
      const existing = allLogs[existingIndex];
      const newCount = Math.max(existing.completedCount - 1, 0);
      const updatedLogs = [...allLogs];
      updatedLogs[existingIndex] = {
        ...existing,
        completedCount: newCount,
        isCompleted: false,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
    }
  }, []);

  const resetHabit = useCallback((habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allLogs = getLogs();
    const updatedLogs = allLogs.filter(l => !(l.habitId === habitId && l.date === today));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
  }, []);

  return { logs, getTodayLog, getAllTodayLogs, toggleHabit, incrementHabit, decrementHabit, resetHabit };
};

const updateStreak = (habitId: string, completedDate: string) => {
  const allStreaks = getStreaks();
  const existingIndex = allStreaks.findIndex(s => s.habitId === habitId);
  
  let newStreak: HabitStreak;
  
  if (existingIndex >= 0) {
    const existing = allStreaks[existingIndex];
    const lastDate = existing.lastCompletedDate;
    const yesterday = format(subDays(new Date(completedDate), 1), 'yyyy-MM-dd');
    
    if (lastDate === yesterday || lastDate === completedDate) {
      // Continue or same day
      const newCurrentStreak = lastDate === completedDate ? existing.currentStreak : existing.currentStreak + 1;
      newStreak = {
        ...existing,
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(existing.longestStreak, newCurrentStreak),
        lastCompletedDate: completedDate,
      };
    } else {
      // Streak broken, start new
      newStreak = {
        ...existing,
        currentStreak: 1,
        lastCompletedDate: completedDate,
      };
    }
    allStreaks[existingIndex] = newStreak;
  } else {
    newStreak = {
      habitId,
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: completedDate,
    };
    allStreaks.push(newStreak);
  }
  
  localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(allStreaks));
};

export const useLocalHabitStats = () => {
  const [stats, setStats] = useState({
    completedToday: 0,
    totalHabits: 0,
    todayProgress: 0,
    weeklyRate: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    const habits = initializeHabits();
    const logs = getLogs();
    const streaks = getStreaks();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const todayLogs = logs.filter(l => l.date === today && l.isCompleted);
    const completedToday = todayLogs.length;
    const totalHabits = habits.length;
    const todayProgress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
    
    // Calculate weekly rate
    const last7Days = Array.from({ length: 7 }, (_, i) => 
      format(subDays(new Date(), i), 'yyyy-MM-dd')
    );
    const weeklyLogs = logs.filter(l => last7Days.includes(l.date) && l.isCompleted);
    const weeklyRate = totalHabits > 0 
      ? Math.round((weeklyLogs.length / (totalHabits * 7)) * 100) 
      : 0;
    
    // Get best streak
    const maxStreak = streaks.reduce((max, s) => Math.max(max, s.longestStreak), 0);
    const currentMaxStreak = streaks.reduce((max, s) => {
      if (s.lastCompletedDate === today || s.lastCompletedDate === format(subDays(new Date(), 1), 'yyyy-MM-dd')) {
        return Math.max(max, s.currentStreak);
      }
      return max;
    }, 0);
    
    setStats({
      completedToday,
      totalHabits,
      todayProgress,
      weeklyRate,
      currentStreak: currentMaxStreak,
      longestStreak: maxStreak,
    });
  }, []);

  return stats;
};

export const useLocalWeeklyProgress = () => {
  const [progress, setProgress] = useState<Array<{
    date: string;
    dayName: string;
    completedCount: number;
    isToday: boolean;
  }>>([]);

  useEffect(() => {
    const logs = getLogs();
    const today = format(new Date(), 'yyyy-MM-dd');
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayOfWeek = new Date(date).getDay();
      const dayLogs = logs.filter(l => l.date === date && l.isCompleted);
      
      return {
        date,
        dayName: dayNames[dayOfWeek],
        completedCount: dayLogs.length,
        isToday: date === today,
      };
    });
    
    setProgress(weekData);
  }, []);

  return progress;
};

export const useHabitsByCategory = (category: HabitCategory, isRamadhanMode: boolean = false) => {
  const { habits } = useLocalHabits(isRamadhanMode);
  return habits.filter(h => h.category === category);
};
