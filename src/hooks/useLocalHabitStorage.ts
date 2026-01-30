import { useState, useEffect, useCallback } from 'react';

// Types for local storage data
interface LocalIbadahLog {
  id: string;
  habitId: string;
  habitName: string;
  logDate: string;
  count: number;
  targetCount: number;
  completedAt?: string;
  createdAt: string;
}

interface LocalSedekahLog {
  id: string;
  sedekahTypeId?: string;
  typeName: string;
  logDate: string;
  amount?: number;
  description?: string;
  isSedekahSubuh: boolean;
  createdAt: string;
}

interface LocalOlahragaLog {
  id: string;
  exerciseTypeId?: string;
  typeName: string;
  logDate: string;
  durationMinutes: number;
  intensity: string;
  timeOfDay?: string;
  notes?: string;
  createdAt: string;
}

interface LocalDzikirLog {
  id: string;
  dzikirTypeId?: string;
  dzikirName: string;
  logDate: string;
  count: number;
  targetCount: number;
  sessionId?: string;
  completedAt?: string;
  createdAt: string;
}

interface LocalQuranLog {
  id: string;
  surahNumber: number;
  surahName: string;
  fromAyat: number;
  toAyat: number;
  totalAyat: number;
  logDate: string;
  notes?: string;
  createdAt: string;
}

interface LocalMealLog {
  id: string;
  logDate: string;
  mealType: 'sahur' | 'iftar';
  isSkipped: boolean;
  waterGlasses: number;
  proteinSource?: string;
  carbSource?: string;
  vegetables?: string;
  fruits?: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  ibadah: 'habit_ibadah_logs',
  sedekah: 'habit_sedekah_logs',
  olahraga: 'habit_olahraga_logs',
  dzikir: 'habit_dzikir_logs',
  quran: 'habit_quran_logs',
  meal: 'habit_meal_logs',
  ramadhanMode: 'habit_ramadhan_mode',
};

// Generic local storage hook
function useLocalStorage<T>(key: string, initialValue: T[]): [T[], (value: T[] | ((prev: T[]) => T[])) => void] {
  const [storedValue, setStoredValue] = useState<T[]>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Ibadah logs
export const useLocalIbadahLogs = () => {
  const [logs, setLogs] = useLocalStorage<LocalIbadahLog>(STORAGE_KEYS.ibadah, []);

  const addLog = useCallback((log: Omit<LocalIbadahLog, 'id' | 'createdAt'>) => {
    const newLog: LocalIbadahLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [setLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.logDate === today);
  }, [logs]);

  const getLogsByDateRange = useCallback((startDate: string, endDate: string) => {
    return logs.filter(log => log.logDate >= startDate && log.logDate <= endDate);
  }, [logs]);

  return { logs, addLog, getTodayLogs, getLogsByDateRange };
};

// Sedekah logs
export const useLocalSedekahLogs = () => {
  const [logs, setLogs] = useLocalStorage<LocalSedekahLog>(STORAGE_KEYS.sedekah, []);

  const addLog = useCallback((log: Omit<LocalSedekahLog, 'id' | 'createdAt'>) => {
    const newLog: LocalSedekahLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [setLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.logDate === today);
  }, [logs]);

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.logDate === today);
    const totalAmount = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
    const todayAmount = todayLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
    
    return {
      totalLogs: logs.length,
      todayLogs: todayLogs.length,
      totalAmount,
      todayAmount,
      sedekahSubuhCount: logs.filter(log => log.isSedekahSubuh).length,
    };
  }, [logs]);

  return { logs, addLog, getTodayLogs, getStats };
};

// Olahraga logs
export const useLocalOlahragaLogs = () => {
  const [logs, setLogs] = useLocalStorage<LocalOlahragaLog>(STORAGE_KEYS.olahraga, []);

  const addLog = useCallback((log: Omit<LocalOlahragaLog, 'id' | 'createdAt'>) => {
    const newLog: LocalOlahragaLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [setLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.logDate === today);
  }, [logs]);

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.logDate === today);
    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const todayMinutes = todayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
    
    return {
      totalSessions: logs.length,
      todaySessions: todayLogs.length,
      totalMinutes,
      todayMinutes,
    };
  }, [logs]);

  return { logs, addLog, getTodayLogs, getStats };
};

// Dzikir logs
export const useLocalDzikirLogs = () => {
  const [logs, setLogs] = useLocalStorage<LocalDzikirLog>(STORAGE_KEYS.dzikir, []);

  const addLog = useCallback((log: Omit<LocalDzikirLog, 'id' | 'createdAt'>) => {
    const newLog: LocalDzikirLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [setLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.logDate === today);
  }, [logs]);

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.logDate === today);
    
    // Group by dzikir type
    const statsByType: Record<string, { name: string; totalCount: number; sessions: number }> = {};
    logs.forEach(log => {
      const key = log.dzikirName;
      if (!statsByType[key]) {
        statsByType[key] = { name: key, totalCount: 0, sessions: 0 };
      }
      statsByType[key].totalCount += log.count;
      statsByType[key].sessions++;
    });

    return {
      totalDzikirToday: todayLogs.reduce((sum, log) => sum + log.count, 0),
      totalDzikirAll: logs.reduce((sum, log) => sum + log.count, 0),
      sessionsToday: todayLogs.length,
      statsByType: Object.values(statsByType).sort((a, b) => b.totalCount - a.totalCount),
    };
  }, [logs]);

  return { logs, addLog, getTodayLogs, getStats };
};

// Quran logs
export const useLocalQuranLogs = () => {
  const [logs, setLogs] = useLocalStorage<LocalQuranLog>(STORAGE_KEYS.quran, []);

  const addLog = useCallback((log: Omit<LocalQuranLog, 'id' | 'createdAt'>) => {
    const newLog: LocalQuranLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [setLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.logDate === today);
  }, [logs]);

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.logDate === today);
    const totalAyat = logs.reduce((sum, log) => sum + log.totalAyat, 0);
    const todayAyat = todayLogs.reduce((sum, log) => sum + log.totalAyat, 0);
    
    return {
      totalSessions: logs.length,
      todaySessions: todayLogs.length,
      totalAyat,
      todayAyat,
    };
  }, [logs]);

  return { logs, addLog, getTodayLogs, getStats };
};

// Meal logs
export const useLocalMealLogs = () => {
  const [logs, setLogs] = useLocalStorage<LocalMealLog>(STORAGE_KEYS.meal, []);

  const addLog = useCallback((log: Omit<LocalMealLog, 'id' | 'createdAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if log for this meal type today already exists
    const existingIndex = logs.findIndex(
      l => l.logDate === today && l.mealType === log.mealType
    );
    
    if (existingIndex >= 0) {
      // Update existing
      const updatedLogs = [...logs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        ...log,
      };
      setLogs(updatedLogs);
      return updatedLogs[existingIndex];
    }
    
    // Create new
    const newLog: LocalMealLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [logs, setLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.logDate === today);
  }, [logs]);

  const getStats = useCallback(() => {
    const sahurLogs = logs.filter(log => log.mealType === 'sahur');
    const iftarLogs = logs.filter(log => log.mealType === 'iftar');
    const avgWater = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.waterGlasses, 0) / logs.length 
      : 0;
    
    return {
      totalSahur: sahurLogs.length,
      totalIftar: iftarLogs.length,
      skippedSahur: sahurLogs.filter(l => l.isSkipped).length,
      skippedIftar: iftarLogs.filter(l => l.isSkipped).length,
      avgWaterGlasses: Math.round(avgWater * 10) / 10,
    };
  }, [logs]);

  return { logs, addLog, getTodayLogs, getStats };
};

// Ramadhan mode
export const useLocalRamadhanMode = () => {
  const [isRamadhanMode, setIsRamadhanMode] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ramadhanMode);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const toggleRamadhanMode = useCallback(() => {
    const newValue = !isRamadhanMode;
    setIsRamadhanMode(newValue);
    localStorage.setItem(STORAGE_KEYS.ramadhanMode, JSON.stringify(newValue));
  }, [isRamadhanMode]);

  return { isRamadhanMode, toggleRamadhanMode };
};
