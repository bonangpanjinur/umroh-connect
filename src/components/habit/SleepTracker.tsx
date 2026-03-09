import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Moon, Sun, Clock, TrendingUp, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

const STORAGE_KEY = 'sleep_tracker';

interface SleepLog {
  date: string;
  bedtime: string;  // HH:mm
  wakeTime: string; // HH:mm
  duration: number;  // minutes
}

const calcDuration = (bed: string, wake: string): number => {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60; // crosses midnight
  return wakeMin - bedMin;
};

const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}j ${m}m`;
};

const getSleepQuality = (mins: number): { label: string; color: string } => {
  if (mins >= 420 && mins <= 540) return { label: 'Ideal', color: 'text-emerald-500' };
  if (mins >= 360) return { label: 'Cukup', color: 'text-amber-500' };
  return { label: 'Kurang', color: 'text-rose-500' };
};

const SleepTracker = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [logs, setLogs] = useState<Record<string, SleepLog>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });

  const [bedtime, setBedtime] = useState(logs[today]?.bedtime || '22:00');
  const [wakeTime, setWakeTime] = useState(logs[today]?.wakeTime || '05:00');
  const [saved, setSaved] = useState(!!logs[today]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const duration = calcDuration(bedtime, wakeTime);
  const quality = getSleepQuality(duration);

  const handleSave = () => {
    const log: SleepLog = { date: today, bedtime, wakeTime, duration };
    setLogs(prev => ({ ...prev, [today]: log }));
    setSaved(true);
  };

  // Weekly data
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayName = format(subDays(new Date(), 6 - i), 'EEE', { locale: id });
      const log = logs[date];
      return { date, dayName, duration: log?.duration || 0, isToday: date === today };
    });
  }, [logs, today]);

  const avgDuration = useMemo(() => {
    const filled = weekData.filter(d => d.duration > 0);
    if (filled.length === 0) return 0;
    return Math.round(filled.reduce((s, d) => s + d.duration, 0) / filled.length);
  }, [weekData]);

  const maxDuration = Math.max(...weekData.map(d => d.duration), 600);

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Tidur</p>
              <p className="text-[10px] text-muted-foreground">
                {avgDuration > 0 ? `Rata-rata: ${formatDuration(avgDuration)}/malam` : 'Catat tidurmu'}
              </p>
            </div>
          </div>
          {saved && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <span className={`text-xs font-bold ${quality.color}`}>{quality.label} ✓</span>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Moon className="w-3 h-3" /> Tidur
            </label>
            <Input type="time" value={bedtime} onChange={e => { setBedtime(e.target.value); setSaved(false); }} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sun className="w-3 h-3" /> Bangun
            </label>
            <Input type="time" value={wakeTime} onChange={e => { setWakeTime(e.target.value); setSaved(false); }} className="h-9 text-sm" />
          </div>
        </div>

        {/* Duration preview */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Durasi: <strong>{formatDuration(duration)}</strong></span>
          </div>
          <span className={`text-xs font-medium ${quality.color}`}>{quality.label}</span>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saved} 
          size="sm" 
          className="w-full gap-1.5"
        >
          {saved ? <><Check className="w-4 h-4" /> Tersimpan</> : 'Simpan'}
        </Button>

        {/* Weekly Chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Trend Mingguan</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {weekData.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: day.duration > 0 ? `${(day.duration / maxDuration) * 100}%` : '4px' }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-full rounded-t ${
                    day.isToday 
                      ? 'bg-indigo-500' 
                      : day.duration >= 420 
                        ? 'bg-indigo-300 dark:bg-indigo-700' 
                        : day.duration > 0 
                          ? 'bg-amber-300 dark:bg-amber-700' 
                          : 'bg-muted'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {weekData.map(day => (
              <span key={day.date} className={`flex-1 text-center text-[8px] ${day.isToday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {day.dayName}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SleepTracker;
