import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, ChevronDown, ChevronUp, Check, Circle, Plus,
  Lightbulb, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Target, Clock, Star, TrendingDown, TrendingUp
} from 'lucide-react';
import { DefaultHabit, categoryInfo } from '@/data/defaultHabits';
import { moodConfig, MoodType } from '@/hooks/useMoodTracking';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';
import HabitProgressCard from './HabitProgressCard';

interface MoodAwareHabitListProps {
  habits: DefaultHabit[];
  moodLevel: number;
  energyLevel: number;
  currentMood: string;
  onShowLibrary: () => void;
}

export const MoodAwareHabitList = ({
  habits,
  moodLevel,
  energyLevel,
  currentMood,
  onShowLibrary,
}: MoodAwareHabitListProps) => {
  const { getTodayLog, toggleHabit, getAllTodayLogs } = useLocalHabitLogs();
  const [showAllHabits, setShowAllHabits] = useState(false);
  
  const config = moodConfig[currentMood as MoodType] || moodConfig.neutral;
  const effectiveEnergy = energyLevel * config.energyModifier;
  
  // Categorize habits based on mood and energy
  const categorizeHabits = () => {
    const completed = habits.filter(h => getTodayLog(h.id)?.isCompleted);
    const incomplete = habits.filter(h => !getTodayLog(h.id)?.isCompleted);
    
    // Priority habits based on mood
    const priority = incomplete.filter(h => 
      config.suggestedCategories.includes(h.category)
    );
    
    // Habits to take easy on
    const lowPriority = incomplete.filter(h => 
      config.avoidCategories.includes(h.category)
    );
    
    // Other incomplete habits
    const other = incomplete.filter(h => 
      !config.suggestedCategories.includes(h.category) &&
      !config.avoidCategories.includes(h.category)
    );
    
    return { completed, priority, lowPriority, other };
  };
  
  const { completed, priority, lowPriority, other } = categorizeHabits();
  
  // Determine how many habits to show based on energy
  const getRecommendedCount = () => {
    if (effectiveEnergy >= 2.5) return 7;
    if (effectiveEnergy >= 1.5) return 5;
    return 3;
  };
  
  const recommendedCount = getRecommendedCount();
  const priorityToShow = priority.slice(0, recommendedCount);
  const hasMore = (priority.length + other.length) > recommendedCount;
  
  const getEnergyIcon = () => {
    if (effectiveEnergy >= 2.5) return BatteryFull;
    if (effectiveEnergy >= 1.5) return BatteryMedium;
    return BatteryLow;
  };
  
  const EnergyIcon = getEnergyIcon();
  
  const completedCount = completed.length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  const handleToggle = (habit: DefaultHabit) => {
    toggleHabit(habit.id, habit.target_count || 1);
  };

  return (
    <div className="space-y-4">
      {/* Energy & Recommendation Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`border-0 ${config.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <EnergyIcon className={`w-5 h-5 ${config.color}`} />
                  <span className="text-sm font-medium">Level Energi</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {effectiveEnergy >= 2.5 
                    ? 'Tinggi - bisa ambil banyak tantangan!'
                    : effectiveEnergy >= 1.5
                      ? 'Sedang - fokus pada yang penting'
                      : 'Rendah - ambil yang ringan saja'}
                </p>
              </div>
              <Badge className={`${config.bg} ${config.color} border-0`}>
                {recommendedCount} prioritas
              </Badge>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress hari ini</span>
                <span className="font-medium">{completedCount}/{totalHabits}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Priority Habits Section */}
      {priorityToShow.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Prioritas Hari Ini</h3>
            <Badge variant="secondary" className="text-[10px]">
              Sesuai mood
            </Badge>
          </div>
          
          <div className="space-y-2">
            {priorityToShow.map((habit, index) => {
              const todayLog = getTodayLog(habit.id);
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <HabitProgressCard
                    habit={habit}
                    currentCount={todayLog?.completedCount || 0}
                    isCompleted={todayLog?.isCompleted || false}
                    onToggle={() => handleToggle(habit)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low Priority Warning */}
      {lowPriority.length > 0 && !showAllHabits && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Saran</p>
                  <p className="text-xs text-muted-foreground">
                    {lowPriority.length} habit ({lowPriority.map(h => categoryInfo[h.category].label).join(', ')}) 
                    mungkin bisa ditunda dulu sesuai kondisimu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Show More / Other Habits */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setShowAllHabits(!showAllHabits)}
        >
          {showAllHabits ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Sembunyikan
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Lihat semua habit ({habits.length - priorityToShow.length - completed.length} lainnya)
            </>
          )}
        </Button>
      )}

      {/* All Other Habits */}
      <AnimatePresence>
        {showAllHabits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {other.map((habit, index) => {
              const todayLog = getTodayLog(habit.id);
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <HabitProgressCard
                    habit={habit}
                    currentCount={todayLog?.completedCount || 0}
                    isCompleted={todayLog?.isCompleted || false}
                    onToggle={() => handleToggle(habit)}
                  />
                </motion.div>
              );
            })}
            
            {/* Low priority habits with warning */}
            {lowPriority.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Bisa ditunda (sesuai kondisi)
                  </span>
                </div>
                {lowPriority.map((habit, index) => {
                  const todayLog = getTodayLog(habit.id);
                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                    >
                      <HabitProgressCard
                        habit={habit}
                        currentCount={todayLog?.completedCount || 0}
                        isCompleted={todayLog?.isCompleted || false}
                        onToggle={() => handleToggle(habit)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Section */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Selesai ({completed.length})
            </span>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-2.5 flex flex-wrap gap-1.5">
              {completed.map((habit) => (
                <Badge 
                  key={habit.id}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                  onClick={() => handleToggle(habit)}
                >
                  <Check className="w-3 h-3 mr-1" />
                  {habit.name}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {habits.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Belum ada habit</p>
            <Button size="sm" className="mt-4" onClick={onShowLibrary}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Habit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manage Habits Button */}
      {habits.length > 0 && (
        <Button
          variant="outline"
          className="w-full h-11 justify-between text-sm"
          onClick={onShowLibrary}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Kelola Habit
          </span>
          <Badge variant="secondary" className="text-xs">
            {habits.length} aktif
          </Badge>
        </Button>
      )}
    </div>
  );
};

export default MoodAwareHabitList;
