import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, ChevronDown, Trophy, Clock, Flame,
  CheckCircle2, Circle, Plus, Zap
} from 'lucide-react';
import { DefaultHabit, HabitCategory, categoryInfo } from '@/data/defaultHabits';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';
import HabitProgressCard from './HabitProgressCard';
import MoodCheckIn from './MoodCheckIn';
import DailyStats from './DailyStats';
import CategoryHabitCard from './CategoryHabitCard';

// Group habits by category
const groupByCategory = (habits: DefaultHabit[]): Record<HabitCategory, DefaultHabit[]> => {
  const grouped: Record<HabitCategory, DefaultHabit[]> = {
    spiritual: [],
    belajar: [],
    kesehatan: [],
    produktivitas: [],
    mental: [],
    sosial: [],
    finansial: [],
  };
  
  habits.forEach(habit => {
    if (grouped[habit.category]) {
      grouped[habit.category].push(habit);
    }
  });
  
  return grouped;
};

interface TodayHabitsListProps {
  habits: DefaultHabit[];
  isRamadhanMode?: boolean;
  stats: {
    completedToday: number;
    totalHabits: number;
    todayProgress: number;
    weeklyRate: number;
    currentStreak: number;
    longestStreak: number;
  };
  weeklyProgress: Array<{
    date: string;
    dayName: string;
    completedCount: number;
    isToday: boolean;
  }>;
  onAddHabit: (habit: DefaultHabit) => void;
  onRemoveHabit: (habitId: string) => void;
  onShowLibrary: () => void;
}

export const TodayHabitsList = ({ 
  habits, 
  isRamadhanMode = false,
  stats,
  weeklyProgress,
  onAddHabit,
  onRemoveHabit,
  onShowLibrary,
}: TodayHabitsListProps) => {
  const [viewMode, setViewMode] = useState<'priority' | 'category'>('priority');
  const { getTodayLog, toggleHabit } = useLocalHabitLogs();

  // Get habits grouped by completion status
  const completedHabits = habits.filter(h => getTodayLog(h.id)?.isCompleted);
  const incompleteHabits = habits.filter(h => !getTodayLog(h.id)?.isCompleted);
  
  // Get priority habits (first 5-7 incomplete, then completed)
  const priorityHabits = [...incompleteHabits.slice(0, 5), ...completedHabits.slice(0, 3)];
  
  // Group by category for category view
  const habitsByCategory = groupByCategory(habits);
  const categoryOrder: HabitCategory[] = ['spiritual', 'belajar', 'kesehatan', 'produktivitas', 'mental', 'sosial', 'finansial'];

  const handleToggle = (habit: DefaultHabit) => {
    toggleHabit(habit.id, habit.target_count || 1);
  };

  return (
    <div className="space-y-4">
      {/* Mood Check-in Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MoodCheckIn />
      </motion.div>

      {/* Daily Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DailyStats
          completedToday={stats.completedToday}
          totalHabits={stats.totalHabits}
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
          weeklyRate={stats.weeklyRate}
          weeklyProgress={weeklyProgress}
        />
      </motion.div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Habit Hari Ini</h3>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <Button
            variant={viewMode === 'priority' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setViewMode('priority')}
          >
            Prioritas
          </Button>
          <Button
            variant={viewMode === 'category' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setViewMode('category')}
          >
            Kategori
          </Button>
        </div>
      </div>

      {/* Habits List */}
      <AnimatePresence mode="wait">
        {viewMode === 'priority' ? (
          <motion.div
            key="priority"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Incomplete Habits - Priority Display */}
            {incompleteHabits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Belum Selesai ({incompleteHabits.length})
                  </span>
                </div>
                {incompleteHabits.slice(0, 7).map((habit) => {
                  const todayLog = getTodayLog(habit.id);
                  return (
                    <HabitProgressCard
                      key={habit.id}
                      habit={habit}
                      currentCount={todayLog?.completedCount || 0}
                      isCompleted={false}
                      onToggle={() => handleToggle(habit)}
                    />
                  );
                })}
                {incompleteHabits.length > 7 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => setViewMode('category')}
                  >
                    +{incompleteHabits.length - 7} habit lainnya
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}

            {/* Completed Habits - Compact Display */}
            {completedHabits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Selesai ({completedHabits.length})
                  </span>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-2.5 flex flex-wrap gap-1.5">
                    {completedHabits.map((habit) => (
                      <Badge 
                        key={habit.id}
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                        onClick={() => handleToggle(habit)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {habit.name}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {habits.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Belum ada habit</p>
                  <p className="text-xs text-muted-foreground mt-1">Tambah habit untuk mulai tracking</p>
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={onShowLibrary}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Habit
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="category"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {categoryOrder.map((category) => {
              const categoryHabits = habitsByCategory[category];
              if (categoryHabits.length === 0) return null;
              
              return (
                <CategoryHabitCard
                  key={category}
                  category={category}
                  activeHabits={categoryHabits}
                  isRamadhanMode={isRamadhanMode}
                  onAddHabit={onAddHabit}
                  onRemoveHabit={onRemoveHabit}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Button */}
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
    </div>
  );
};

export default TodayHabitsList;
