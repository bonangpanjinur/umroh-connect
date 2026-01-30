import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, ChevronDown, ChevronUp, Check, Plus,
  Battery, BatteryLow, BatteryMedium, BatteryFull,
  Target, Lightbulb, TrendingDown, Trophy, Zap,
  Flame, CheckCircle2, AlertCircle
} from 'lucide-react';
import { DefaultHabit, categoryInfo } from '@/data/defaultHabits';
import { moodConfig, MoodType } from '@/hooks/useMoodTracking';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';
import SmartHabitCard from './SmartHabitCard';

interface MoodAwareHabitListProps {
  habits: DefaultHabit[];
  moodLevel: number;
  energyLevel: number;
  currentMood: string;
  onShowLibrary: () => void;
  onOpenTasbih?: () => void;
}

export const MoodAwareHabitList = ({
  habits,
  moodLevel,
  energyLevel,
  currentMood,
  onShowLibrary,
  onOpenTasbih,
}: MoodAwareHabitListProps) => {
  const { getTodayLog, toggleHabit, incrementHabit, decrementHabit } = useLocalHabitLogs();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showLowPriority, setShowLowPriority] = useState(false);
  
  const config = moodConfig[currentMood as MoodType] || moodConfig.neutral;
  const effectiveEnergy = energyLevel * config.energyModifier;
  
  // Separate dzikir habits (link to tasbih)
  const dzikirHabitIds = ['istighfar', 'sholawat', 'tasbih', 'dzikir'];
  const isDzikirHabit = (habit: DefaultHabit) => 
    dzikirHabitIds.some(id => habit.id.toLowerCase().includes(id));
  
  // Categorize habits based on mood and energy
  const categorizeHabits = () => {
    const completed: DefaultHabit[] = [];
    const priority: DefaultHabit[] = [];
    const lowPriority: DefaultHabit[] = [];
    const other: DefaultHabit[] = [];
    const dzikir: DefaultHabit[] = [];
    
    habits.forEach(habit => {
      const log = getTodayLog(habit.id);
      
      // Check if dzikir habit
      if (isDzikirHabit(habit)) {
        dzikir.push(habit);
        return;
      }
      
      if (log?.isCompleted) {
        completed.push(habit);
      } else if (config.suggestedCategories.includes(habit.category)) {
        priority.push(habit);
      } else if (config.avoidCategories.includes(habit.category)) {
        lowPriority.push(habit);
      } else {
        other.push(habit);
      }
    });
    
    return { completed, priority, lowPriority, other, dzikir };
  };
  
  const { completed, priority, lowPriority, other, dzikir } = categorizeHabits();
  const incomplete = [...priority, ...other];
  
  // Stats
  const totalHabits = habits.length;
  const completedCount = completed.length;
  const progressPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
  
  // Energy display
  const getEnergyDisplay = () => {
    if (effectiveEnergy >= 2.5) return { icon: BatteryFull, label: 'Energi Tinggi', color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
    if (effectiveEnergy >= 1.5) return { icon: BatteryMedium, label: 'Energi Sedang', color: 'text-amber-600', bg: 'bg-amber-500/10' };
    return { icon: BatteryLow, label: 'Energi Rendah', color: 'text-rose-600', bg: 'bg-rose-500/10' };
  };
  
  const energyDisplay = getEnergyDisplay();
  const EnergyIcon = energyDisplay.icon;

  const handleIncrement = (habit: DefaultHabit) => {
    incrementHabit(habit.id, habit.target_count || 1);
  };

  const handleDecrement = (habit: DefaultHabit) => {
    decrementHabit(habit.id);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`border-0 bg-gradient-to-br ${
          progressPercent >= 80 ? 'from-emerald-500/10 to-primary/5' :
          progressPercent >= 50 ? 'from-amber-500/10 to-orange-500/5' :
          'from-muted to-muted/50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  progressPercent >= 80 ? 'bg-emerald-500' :
                  progressPercent >= 50 ? 'bg-amber-500' :
                  'bg-muted-foreground'
                } text-white`}>
                  {progressPercent >= 80 ? (
                    <Trophy className="w-6 h-6" />
                  ) : progressPercent >= 50 ? (
                    <Zap className="w-6 h-6" />
                  ) : (
                    <Target className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {completedCount}/{totalHabits} Selesai
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {progressPercent >= 80 ? 'Luar biasa! 🎉' :
                     progressPercent >= 50 ? 'Semangat, hampir selesai!' :
                     'Yuk mulai hari ini!'}
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${energyDisplay.bg}`}>
                <EnergyIcon className={`w-4 h-4 ${energyDisplay.color}`} />
                <span className={`text-xs font-medium ${energyDisplay.color}`}>
                  {energyDisplay.label}
                </span>
              </div>
            </div>
            
            <Progress value={progressPercent} className="h-2.5" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Dzikir Section - Link to Tasbih */}
      {dzikir.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Dzikir & Wirid</h3>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
              Buka Tasbih
            </Badge>
          </div>
          
          <div className="space-y-2">
            {dzikir.map((habit, index) => {
              const todayLog = getTodayLog(habit.id);
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SmartHabitCard
                    habit={habit}
                    currentCount={todayLog?.completedCount || 0}
                    isCompleted={todayLog?.isCompleted || false}
                    onIncrement={() => handleIncrement(habit)}
                    onOpenTasbih={onOpenTasbih}
                    variant="dzikir"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority Habits - Based on Mood */}
      {priority.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Prioritas Untukmu</h3>
            <Badge className="text-[10px] bg-primary/10 text-primary border-0">
              {priority.length} habit
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground -mt-1">
            Berdasarkan mood & energimu saat ini
          </p>
          
          <div className="space-y-2">
            {priority.map((habit, index) => {
              const todayLog = getTodayLog(habit.id);
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SmartHabitCard
                    habit={habit}
                    currentCount={todayLog?.completedCount || 0}
                    isCompleted={todayLog?.isCompleted || false}
                    onIncrement={() => handleIncrement(habit)}
                    onDecrement={() => handleDecrement(habit)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Habits */}
      {other.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-sm">Habit Lainnya</h3>
            <Badge variant="secondary" className="text-[10px]">
              {other.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {other.map((habit, index) => {
              const todayLog = getTodayLog(habit.id);
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SmartHabitCard
                    habit={habit}
                    currentCount={todayLog?.completedCount || 0}
                    isCompleted={todayLog?.isCompleted || false}
                    onIncrement={() => handleIncrement(habit)}
                    onDecrement={() => handleDecrement(habit)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low Priority Warning */}
      {lowPriority.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
            onClick={() => setShowLowPriority(!showLowPriority)}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-xs">
                {lowPriority.length} habit bisa ditunda (energi rendah)
              </span>
            </div>
            {showLowPriority ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          
          <AnimatePresence>
            {showLowPriority && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {lowPriority.map((habit, index) => {
                  const todayLog = getTodayLog(habit.id);
                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                    >
                      <SmartHabitCard
                        habit={habit}
                        currentCount={todayLog?.completedCount || 0}
                        isCompleted={todayLog?.isCompleted || false}
                        onIncrement={() => handleIncrement(habit)}
                        onDecrement={() => handleDecrement(habit)}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Section */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Selesai ({completed.length})</span>
            </div>
            {showCompleted ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          
          <AnimatePresence>
            {showCompleted ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {completed.map((habit) => {
                  const todayLog = getTodayLog(habit.id);
                  return (
                    <SmartHabitCard
                      key={habit.id}
                      habit={habit}
                      currentCount={todayLog?.completedCount || 0}
                      isCompleted={true}
                      onIncrement={() => handleIncrement(habit)}
                    />
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-2.5 flex flex-wrap gap-1.5">
                    {completed.map((habit) => (
                      <Badge 
                        key={habit.id}
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {habit.name}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
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
