import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, Zap, Target, TrendingUp, Award, Calendar, 
  CheckCircle2, Star, Trophy
} from 'lucide-react';

interface DailyStatsProps {
  completedToday: number;
  totalHabits: number;
  currentStreak: number;
  longestStreak: number;
  weeklyRate: number;
  weeklyProgress: Array<{
    date: string;
    dayName: string;
    completedCount: number;
    isToday: boolean;
  }>;
}

export const DailyStats = ({
  completedToday,
  totalHabits,
  currentStreak,
  longestStreak,
  weeklyRate,
  weeklyProgress,
}: DailyStatsProps) => {
  const progressPercent = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const maxCompleted = Math.max(...weeklyProgress.map(d => d.completedCount), 1);

  const getMotivationalMessage = () => {
    if (progressPercent === 100) return "Sempurna! 🎉";
    if (progressPercent >= 75) return "Hampir selesai!";
    if (progressPercent >= 50) return "Separuh jalan!";
    if (progressPercent >= 25) return "Terus semangat!";
    return "Ayo mulai!";
  };

  return (
    <div className="space-y-3">
      {/* Main Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hari Ini</p>
                  <p className="font-bold text-lg">{getMotivationalMessage()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {completedToday}<span className="text-base text-muted-foreground">/{totalHabits}</span>
                </p>
                <p className="text-xs text-muted-foreground">selesai</p>
              </div>
            </div>

            <Progress value={progressPercent} className="h-2.5 mb-3" />

            {/* Mini Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-bold">{currentStreak}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">{longestStreak}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Terbaik</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">{weeklyRate}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Minggu ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Progress Chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Minggu Ini</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyProgress.filter(d => d.completedCount > 0).length}/7 hari aktif
            </p>
          </div>

          <div className="flex items-end justify-between h-20 gap-1">
            {weeklyProgress.map((day, index) => {
              const height = (day.completedCount / maxCompleted) * 100;
              const isPerfect = day.completedCount >= totalHabits && totalHabits > 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 8)}%` }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={`w-full rounded-t-sm transition-colors ${
                      day.isToday 
                        ? 'bg-primary' 
                        : isPerfect
                          ? 'bg-primary/70'
                          : day.completedCount > 0 
                            ? 'bg-primary/40' 
                            : 'bg-muted'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-2">
            {weeklyProgress.map((day) => (
              <div 
                key={day.date} 
                className={`flex-1 text-center text-[10px] ${
                  day.isToday 
                    ? 'text-primary font-bold' 
                    : 'text-muted-foreground'
                }`}
              >
                {day.dayName}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyStats;
