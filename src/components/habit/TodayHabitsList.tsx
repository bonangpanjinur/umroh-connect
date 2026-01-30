import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Circle, Clock, Book, Moon, Sunrise, Sunset, BookOpen, Heart,
  Utensils, Eye, Sparkles, Lightbulb, FileText, PenTool, Headphones, GraduationCap, 
  Footprints, Dumbbell, Move, Smartphone, Droplets, Apple, Target, CheckSquare, 
  ClipboardCheck, Calendar, Home, Brain, Smile, Shield, Users, MessageCircle, 
  Receipt, Coins, Ban, BarChart3, Flame
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
  const { getTodayLog, toggleHabit } = useLocalHabitLogs();

  const handleToggle = (habit: DefaultHabit) => {
    toggleHabit(habit.id, habit.target_count || 1);
  };

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

  return (
    <div className="space-y-2">
      {habits.map((habit, index) => {
        const Icon = iconMap[habit.icon] || Circle;
        const todayLog = getTodayLog(habit.id);
        const isCompleted = todayLog?.isCompleted || false;
        const currentCount = todayLog?.completedCount || 0;
        const targetCount = habit.target_count || 1;
        const progress = targetCount > 1 
          ? (currentCount / targetCount) * 100 
          : isCompleted ? 100 : 0;
        const info = categoryInfo[habit.category];

        return (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card 
              className={`transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isCompleted 
                  ? 'bg-primary/5 border-primary/30 shadow-sm' 
                  : 'hover:border-primary/20 hover:shadow-sm'
              }`}
              onClick={() => handleToggle(habit)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <motion.div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : info.bgColor
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className={`w-5 h-5 ${info.color}`} />
                    )}
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium text-sm truncate ${
                        isCompleted ? 'text-primary line-through opacity-70' : ''
                      }`}>
                        {habit.name}
                      </h4>
                      {habit.is_ramadan_specific && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
                          Ramadan
                        </Badge>
                      )}
                    </div>
                    
                    {targetCount > 1 && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                          <span>{currentCount}/{targetCount}</span>
                          <span className="text-[10px]">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </div>

                  {/* Checkbox */}
                  <motion.div
                    className={`flex-shrink-0 ${
                      isCompleted ? 'text-primary' : 'text-muted-foreground/50'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TodayHabitsList;
