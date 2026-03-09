import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';

const LOGS_KEY = 'tadarus_logs_local';
const LAST_READ_KEY = 'tadarus_last_read';

export interface LocalTadarusLog {
  id: string;
  read_date: string;
  surah_start: number;
  ayah_start: number;
  surah_end: number;
  ayah_end: number;
  total_verses: number;
  juz_start: number | null;
  juz_end: number | null;
  created_at: string;
}

export interface LocalLastRead {
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  updated_at: string;
}

// Basic surah data (114 surahs)
export const basicSurahs = [
  { number: 1, name: 'Al-Fatihah', name_arabic: 'الفاتحة', total_verses: 7 },
  { number: 2, name: 'Al-Baqarah', name_arabic: 'البقرة', total_verses: 286 },
  { number: 3, name: 'Ali \'Imran', name_arabic: 'آل عمران', total_verses: 200 },
  { number: 4, name: 'An-Nisa', name_arabic: 'النساء', total_verses: 176 },
  { number: 5, name: 'Al-Ma\'idah', name_arabic: 'المائدة', total_verses: 120 },
  { number: 6, name: 'Al-An\'am', name_arabic: 'الأنعام', total_verses: 165 },
  { number: 7, name: 'Al-A\'raf', name_arabic: 'الأعراف', total_verses: 206 },
  { number: 8, name: 'Al-Anfal', name_arabic: 'الأنفال', total_verses: 75 },
  { number: 9, name: 'At-Tawbah', name_arabic: 'التوبة', total_verses: 129 },
  { number: 10, name: 'Yunus', name_arabic: 'يونس', total_verses: 109 },
  // Add more essential surahs...
  { number: 36, name: 'Ya-Sin', name_arabic: 'يس', total_verses: 83 },
  { number: 67, name: 'Al-Mulk', name_arabic: 'الملك', total_verses: 30 },
  { number: 78, name: 'An-Naba\'', name_arabic: 'النبأ', total_verses: 40 },
  { number: 112, name: 'Al-Ikhlas', name_arabic: 'الإخلاص', total_verses: 4 },
  { number: 113, name: 'Al-Falaq', name_arabic: 'الفلق', total_verses: 5 },
  { number: 114, name: 'An-Nas', name_arabic: 'الناس', total_verses: 6 },
];

const getLogs = (): LocalTadarusLog[] => {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  } catch {
    return [];
  }
};

const getLastRead = (): LocalLastRead | null => {
  try {
    const data = localStorage.getItem(LAST_READ_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const useLocalQuranSurahs = () => {
  return { data: basicSurahs, isLoading: false };
};

export const useLocalTodayQuranLogs = () => {
  const [logs, setLogs] = useState<LocalTadarusLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allLogs = getLogs();
    setLogs(allLogs.filter(l => l.read_date === today));
    setIsLoading(false);

    const handler = () => {
      const updated = getLogs();
      setLogs(updated.filter(l => l.read_date === today));
    };
    window.addEventListener('tadarus_updated', handler);
    return () => window.removeEventListener('tadarus_updated', handler);
  }, []);

  return { data: logs, isLoading };
};

export const useLocalQuranStats = () => {
  const [stats, setStats] = useState({
    totalVerses: 0,
    daysRead: 0,
    uniqueSurahs: 0,
    estimatedJuz: 0,
  });

  useEffect(() => {
    const allLogs = getLogs();
    const totalVerses = allLogs.reduce((s, l) => s + l.total_verses, 0);
    const uniqueDates = new Set(allLogs.map(l => l.read_date)).size;
    const uniqueSurahs = new Set(allLogs.map(l => l.surah_start)).size;
    // Roughly 604 ayat per juz average (6236 total / 30 juz)
    const estimatedJuz = totalVerses / 208;

    setStats({
      totalVerses,
      daysRead: uniqueDates,
      uniqueSurahs,
      estimatedJuz: Math.min(estimatedJuz, 30),
    });

    const handler = () => {
      const updated = getLogs();
      const tv = updated.reduce((s, l) => s + l.total_verses, 0);
      const ud = new Set(updated.map(l => l.read_date)).size;
      const us = new Set(updated.map(l => l.surah_start)).size;
      setStats({
        totalVerses: tv,
        daysRead: ud,
        uniqueSurahs: us,
        estimatedJuz: Math.min(tv / 208, 30),
      });
    };
    window.addEventListener('tadarus_updated', handler);
    return () => window.removeEventListener('tadarus_updated', handler);
  }, []);

  return stats;
};

export const useLocalQuranLastRead = () => {
  const [lastRead, setLastRead] = useState<LocalLastRead | null>(null);

  useEffect(() => {
    setLastRead(getLastRead());
    const handler = () => setLastRead(getLastRead());
    window.addEventListener('tadarus_updated', handler);
    return () => window.removeEventListener('tadarus_updated', handler);
  }, []);

  return { data: lastRead };
};

export const useAddLocalTadarusLog = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (data: {
    surah_start: number;
    ayah_start: number;
    surah_end: number;
    ayah_end: number;
    total_verses: number;
    juz_end?: number;
  }) => {
    setIsPending(true);
    try {
      const logs = getLogs();
      const newLog: LocalTadarusLog = {
        id: crypto.randomUUID(),
        read_date: format(new Date(), 'yyyy-MM-dd'),
        surah_start: data.surah_start,
        ayah_start: data.ayah_start,
        surah_end: data.surah_end,
        ayah_end: data.ayah_end,
        total_verses: data.total_verses,
        juz_start: null,
        juz_end: data.juz_end || null,
        created_at: new Date().toISOString(),
      };
      logs.unshift(newLog);
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

      // Update last read
      const lastRead: LocalLastRead = {
        surah_number: data.surah_end,
        ayah_number: data.ayah_end,
        juz_number: data.juz_end || 1,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));

      window.dispatchEvent(new Event('tadarus_updated'));
      return newLog;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending };
};

export const useDeleteLocalTadarusLog = () => {
  const mutate = useCallback((logId: string) => {
    const logs = getLogs().filter(l => l.id !== logId);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event('tadarus_updated'));
  }, []);

  return { mutate };
};
