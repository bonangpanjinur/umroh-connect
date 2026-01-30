import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Circle, Clock, Book, Moon, Sunrise, Sunset, BookOpen, Heart,
  Utensils, Eye, Sparkles, Lightbulb, FileText, PenTool, Headphones, GraduationCap, 
  Footprints, Dumbbell, Move, Smartphone, Droplets, Apple, Target, CheckSquare, 
  ClipboardCheck, Calendar, Home, Brain, Smile, Shield, Users, MessageCircle, 
  Receipt, Coins, Ban, BarChart3, Flame, Trophy
} from 'lucide-react';
import { DefaultHabit, categoryInfo } from '@/data/defaultHabits';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';

const iconMap: Record<string, any> = {
  clock: Clock, book: Book, moon: Moon, sunrise: Sunrise, sunset: Sunset,
  'book-open': BookOpen, heart: Heart, utensils: Utensils, eye: Eye,
  sparkles: Sparkles, lightbulb: Lightbulb, 'file-text': FileText,
  'pen-tool': PenTool, headphones: Headphones, 'graduation-cap': GraduationCap,
  footprints: Footprints, dumbbell: Dumbbell, move: Move, droplets: Droplets,
  apple: Apple, target: Target, 'check-square': CheckSquare,
  'clipboard-check': ClipboardCheck, calendar: Calendar, home: Home,
  focus: Target, brain: Brain, smile: Smile, shield: Shield,
  'smartphone-off': Smartphone, users: Users, 'hand-helping': Heart,
  'hand-heart': Heart, 'message-circle': MessageCircle, 'heart-handshake': Heart,
  receipt: Receipt, 'piggy-bank': Coins, coins: Coins, ban: Ban,
  'chart-bar': BarChart3, flame: Flame,
};

interface TodayHabitsListProps {
  habits: DefaultHabit[];
  isRamadhanMode?: boolean;
}

export const TodayHabitsList = ({ habits, isRamadhanMode = false }: TodayHabitsListProps) => {
  const { getTodayLog, toggleHabit, getAllTodayLogs } = useLocalHabitLogs();
  const todayLogs = getAllTodayLogs();

  const handleToggle = (habit: DefaultHabit) => {
    toggleHabit(habit.id, habit.target_count || 1);
  };

  // Separate completed and incomplete habits
  const completedHabits = habits.filter(h => {
    const log = getTodayLog(h.id);
    return log?.isCompleted;
  });
  const incompleteHabits = habits.filter(h => {
    const log = getTodayLog(h.id);
    return !log?.isCompleted;
  });

  if (habits.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Belum ada habit yang dipilih</p>
          <p className="text-xs mt-1">Ketuk "Lihat Semua Habit" untuk menambah</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate completion stats
  const completedCount = completedHabits.length;
  const totalCount = habits.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-3">
      {/* Completion Summary */}
      {completedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Progres Hari Ini</p>
                    <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Incomplete Habits - Priority Display */}
      {incompleteHabits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground px-1">
            Belum Selesai ({incompleteHabits.length})
          </h4>
          {incompleteHabits.map((habit, index) => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              index={index}
              getTodayLog={getTodayLog}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Completed Habits - Collapsed with Details */}
      {completedHabits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            Selesai ({completedHabits.length})
          </h4>
          <div className="space-y-1.5">
            {completedHabits.map((habit, index) => (
              <CompletedHabitCard 
                key={habit.id} 
                habit={habit} 
                index={index}
                getTodayLog={getTodayLog}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Incomplete habit card - full display
interface HabitCardProps {
  habit: DefaultHabit;
  index: number;
  getTodayLog: (id: string) => any;
  onToggle: (habit: DefaultHabit) => void;
}

const HabitCard = ({ habit, index, getTodayLog, onToggle }: HabitCardProps) => {
  const Icon = iconMap[habit.icon] || Circle;
  const todayLog = getTodayLog(habit.id);
  const currentCount = todayLog?.completedCount || 0;
  const targetCount = habit.target_count || 1;
  const progress = targetCount > 1 ? (currentCount / targetCount) * 100 : 0;
  const info = categoryInfo[habit.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card 
        className="transition-all duration-200 cursor-pointer active:scale-[0.98] hover:border-primary/20 hover:shadow-sm"
        onClick={() => onToggle(habit)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <motion.div 
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${info.bgColor}`}
              whileTap={{ scale: 0.9 }}
            >
              <Icon className={`w-5 h-5 ${info.color}`} />
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-medium text-sm truncate">
                  {habit.name}
                </h4>
                {habit.is_ramadan_specific && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
                    Ramadan
                  </Badge>
                )}
              </div>
              
              {targetCount > 1 ? (
                <div className="mt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium">{currentCount} / {targetCount}</span>
                    <span className="text-[10px]">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Ketuk untuk selesaikan</p>
              )}
            </div>

            {/* Checkbox */}
            <motion.div
              className="flex-shrink-0 text-muted-foreground/40"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Circle className="w-6 h-6" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Completed habit card - compact with details
const CompletedHabitCard = ({ habit, index, getTodayLog, onToggle }: HabitCardProps) => {
  const Icon = iconMap[habit.icon] || Circle;
  const todayLog = getTodayLog(habit.id);
  const info = categoryInfo[habit.category];
  const targetCount = habit.target_count || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card 
        className="bg-primary/5 border-primary/20 cursor-pointer active:scale-[0.99]"
        onClick={() => onToggle(habit)}
      >
        <CardContent className="p-2.5">
          <div className="flex items-center gap-2.5">
            {/* Completed Icon */}
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-primary/80 line-through truncate">
                {habit.name}
              </p>
            </div>

            {/* Details Badge */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {targetCount > 1 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                  {targetCount}x
                </Badge>
              )}
              {habit.is_ramadan_specific && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  🌙
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TodayHabitsList;
