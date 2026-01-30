import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, ChevronDown, Trophy, Clock, Flame,
  CheckCircle2, Circle, Plus, Zap, Sparkles, Heart
} from 'lucide-react';
import { DefaultHabit, HabitCategory, categoryInfo } from '@/data/defaultHabits';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';
import { useMoodTracking, MoodLog } from '@/hooks/useMoodTracking';
import MoodCheckIn from './MoodCheckIn';
import MoodAwareHabitList from './MoodAwareHabitList';
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
  onOpenTasbih?: () => void;
}

export const TodayHabitsList = ({ 
  habits, 
  isRamadhanMode = false,
  stats,
  weeklyProgress,
  onAddHabit,
  onRemoveHabit,
  onShowLibrary,
  onOpenTasbih,
}: TodayHabitsListProps) => {
  const [viewMode, setViewMode] = useState<'smart' | 'category'>('smart');
  const { todayMood } = useMoodTracking();
  const [currentMood, setCurrentMood] = useState({
    mood: 'neutral',
    moodLevel: 3,
    energyLevel: 2,
  });

  // Update mood state when todayMood changes
  useEffect(() => {
    if (todayMood) {
      setCurrentMood({
        mood: todayMood.mood,
        moodLevel: todayMood.moodLevel,
        energyLevel: todayMood.energyLevel,
      });
    }
  }, [todayMood]);

  const handleMoodChange = (mood: string, moodLevel: number, energyLevel: number) => {
    setCurrentMood({ mood, moodLevel, energyLevel });
  };

  const handleMoodComplete = (moodLog: MoodLog) => {
    setCurrentMood({
      mood: moodLog.mood,
      moodLevel: moodLog.moodLevel,
      energyLevel: moodLog.energyLevel,
    });
  };

  // Group by category for category view
  const habitsByCategory = groupByCategory(habits);
  const categoryOrder: HabitCategory[] = ['spiritual', 'belajar', 'kesehatan', 'produktivitas', 'mental', 'sosial', 'finansial'];

  return (
    <div className="space-y-4">
      {/* Mood Check-in Card - This is the key interactive element */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MoodCheckIn 
          onComplete={handleMoodComplete}
          onMoodChange={handleMoodChange}
        />
      </motion.div>

      {/* View Mode Toggle - Only show if mood is set */}
      {todayMood && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Habit Hari Ini
          </h3>
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'smart' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode('smart')}
            >
              Smart
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
        </motion.div>
      )}

      {/* Habits List - Mood Aware or Category View */}
      <AnimatePresence mode="wait">
        {!todayMood ? (
          // Show simple list when no mood is set
          <motion.div
            key="simple"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-dashed border-muted-foreground/30">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-rose-400" />
                <p className="text-sm font-medium">Isi mood dulu yuk!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Habit akan disesuaikan dengan perasaanmu
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === 'smart' ? (
          <motion.div
            key="smart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MoodAwareHabitList
              habits={habits}
              moodLevel={currentMood.moodLevel}
              energyLevel={currentMood.energyLevel}
              currentMood={currentMood.mood}
              onShowLibrary={onShowLibrary}
              onOpenTasbih={onOpenTasbih}
            />
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
            
            {/* Manage Habits Button for category view */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Stats - Only show when mood is set */}
      {todayMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
      )}
    </div>
  );
};

export default TodayHabitsList;
