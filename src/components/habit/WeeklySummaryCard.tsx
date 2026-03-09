import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Zap, Smile, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalHabitStats, useLocalWeeklyProgress } from '@/hooks/useLocalHabitTracking';
import { useMoodTracking } from '@/hooks/useMoodTracking';
import { format, subDays } from 'date-fns';

const WeeklySummaryCard = () => {
  const stats = useLocalHabitStats();
  const weeklyProgress = useLocalWeeklyProgress();
  const { moodHistory } = useMoodTracking();

  const weeklyCompletions = useMemo(() => {
    return weeklyProgress.reduce((sum, d) => sum + d.completedCount, 0);
  }, [weeklyProgress]);

  const activeDays = useMemo(() => {
    return weeklyProgress.filter(d => d.completedCount > 0).length;
  }, [weeklyProgress]);

  const avgMood = useMemo(() => {
    try {
      const history = getMoodHistory(7);
      if (history.length === 0) return null;
      const avg = history.reduce((s, m) => s + m.moodLevel, 0) / history.length;
      return Math.round(avg * 10) / 10;
    } catch { return null; }
  }, []);

  const sedekahTotal = useMemo(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('sedekah_logs') || '[]');
      const weekAgo = subDays(new Date(), 7).getTime();
      return logs
        .filter((l: any) => new Date(l.date).getTime() >= weekAgo)
        .reduce((s: number, l: any) => s + (l.amount || 0), 0);
    } catch { return 0; }
  }, []);

  const items = [
    { label: 'Habit Selesai', value: `${weeklyCompletions}`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Hari Aktif', value: `${activeDays}/7`, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Streak', value: `${stats.currentStreak}`, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ...(avgMood !== null ? [{ label: 'Mood', value: `${avgMood}/5`, icon: Smile, color: 'text-blue-500', bg: 'bg-blue-500/10' }] : []),
  ];

  return (
    <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <p className="text-xs font-bold text-foreground mb-3">📊 Ringkasan Minggu Ini</p>
        <div className="grid grid-cols-4 gap-2">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-center"
              >
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-1`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className="text-sm font-bold text-foreground">{item.value}</p>
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySummaryCard;
