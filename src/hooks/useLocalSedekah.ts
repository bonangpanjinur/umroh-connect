import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const STORAGE_KEY = 'sedekah_logs_local';

export interface LocalSedekahType {
  id: string;
  name: string;
  name_arabic: string | null;
  icon: string;
  category: 'uang' | 'makanan' | 'tenaga' | 'barang' | 'kebaikan';
}

export interface LocalSedekahLog {
  id: string;
  sedekah_type_id: string;
  amount: number;
  description: string | null;
  log_date: string;
  is_subuh_mode: boolean;
  created_at: string;
}

// Default sedekah types (no need for database)
export const defaultSedekahTypes: LocalSedekahType[] = [
  { id: 'uang', name: 'Uang', name_arabic: 'مال', icon: 'banknote', category: 'uang' },
  { id: 'makanan', name: 'Makanan', name_arabic: 'طعام', icon: 'utensils', category: 'makanan' },
  { id: 'tenaga', name: 'Tenaga', name_arabic: 'جهد', icon: 'hand-helping', category: 'tenaga' },
  { id: 'barang', name: 'Barang', name_arabic: 'متاع', icon: 'package', category: 'barang' },
  { id: 'senyum', name: 'Senyuman', name_arabic: 'ابتسامة', icon: 'smile', category: 'kebaikan' },
  { id: 'ilmu', name: 'Ilmu', name_arabic: 'علم', icon: 'book-open', category: 'kebaikan' },
];

const getLogs = (): LocalSedekahLog[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const useLocalSedekahTypes = () => {
  return { data: defaultSedekahTypes, isLoading: false };
};

export const useLocalSedekahLogs = () => {
  const [logs, setLogs] = useState<LocalSedekahLog[]>([]);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  const monthLogs = useMemo(() => {
    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    return logs.filter(l => l.log_date >= startDate && l.log_date <= endDate);
  }, [logs]);

  return { data: monthLogs, allLogs: logs, setLogs };
};

export const useLocalSedekahStats = () => {
  const { data: logs } = useLocalSedekahLogs();

  return useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = logs.filter(l => l.log_date === today);
    const totalAmount = logs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const todayAmount = todayLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const uniqueDays = new Set(logs.map(l => l.log_date)).size;
    const subuhCount = logs.filter(l => l.is_subuh_mode).length;

    return {
      totalAmount,
      totalCount: logs.length,
      todayAmount,
      todayCount: todayLogs.length,
      uniqueDays,
      subuhCount,
      hasSedekahToday: todayLogs.length > 0,
    };
  }, [logs]);
};

export const useLocalWeeklySedekah = () => {
  const { allLogs } = useLocalSedekahLogs();

  return useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return Array.from({ length: 7 }).map((_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayOfWeek = new Date(date).getDay();
      const dayLogs = allLogs.filter(l => l.log_date === date);
      const amount = dayLogs.reduce((s, l) => s + (l.amount || 0), 0);

      return {
        date,
        dayName: dayNames[dayOfWeek],
        count: dayLogs.length,
        amount,
        isToday: date === today,
      };
    });
  }, [allLogs]);
};

export const useAddLocalSedekah = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (data: {
    sedekahTypeId: string;
    amount: number;
    description?: string;
    isSubuhMode: boolean;
  }) => {
    setIsPending(true);
    try {
      const logs = getLogs();
      const newLog: LocalSedekahLog = {
        id: crypto.randomUUID(),
        sedekah_type_id: data.sedekahTypeId,
        amount: data.amount,
        description: data.description || null,
        log_date: format(new Date(), 'yyyy-MM-dd'),
        is_subuh_mode: data.isSubuhMode,
        created_at: new Date().toISOString(),
      };
      logs.unshift(newLog);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      window.dispatchEvent(new Event('sedekah_updated'));
      return newLog;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending };
};

export const useDeleteLocalSedekah = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (logId: string) => {
    setIsPending(true);
    try {
      const logs = getLogs().filter(l => l.id !== logId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      window.dispatchEvent(new Event('sedekah_updated'));
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending };
};
