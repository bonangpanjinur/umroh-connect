import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, ChevronUp, Plus, Minus, Check, X,
  Flame, BookOpen, Heart, Target, Brain, Users, Wallet,
  Clock, Book, Moon, Sunrise, BookOpenCheck, Sparkles,
  Lightbulb, GraduationCap, Footprints, Dumbbell, Droplets,
  CheckSquare, ClipboardCheck, Calendar, Smile, MessageCircle,
  Receipt, Coins, Zap
} from 'lucide-react';
import { DefaultHabit, HabitCategory, categoryInfo, allHabitsByCategory } from '@/data/defaultHabits';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';

const categoryIcons: Record<HabitCategory, any> = {
  spiritual: Flame,
  belajar: BookOpen,
  kesehatan: Heart,
  produktivitas: Target,
  mental: Brain,
  sosial: Users,
  finansial: Wallet,
};

const iconMap: Record<string, any> = {
  clock: Clock, book: Book, moon: Moon, sunrise: Sunrise, 
  'book-open': BookOpen, heart: Heart, sparkles: Sparkles,
  lightbulb: Lightbulb, 'graduation-cap': GraduationCap,
  footprints: Footprints, dumbbell: Dumbbell, droplets: Droplets,
  target: Target, 'check-square': CheckSquare, 
  'clipboard-check': ClipboardCheck, calendar: Calendar,
  brain: Brain, smile: Smile, 'message-circle': MessageCircle,
  receipt: Receipt, coins: Coins, flame: Flame,
  'hand-heart': Heart, users: Users,
};

interface CategoryHabitCardProps {
  category: HabitCategory;
  activeHabits: DefaultHabit[];
  isRamadhanMode: boolean;
  onAddHabit: (habit: DefaultHabit) => void;
  onRemoveHabit: (habitId: string) => void;
}

export const CategoryHabitCard = ({
  category,
  activeHabits,
  isRamadhanMode,
  onAddHabit,
  onRemoveHabit,
}: CategoryHabitCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddHabits, setShowAddHabits] = useState(false);
  const { getTodayLog, toggleHabit } = useLocalHabitLogs();
  
  const info = categoryInfo[category];
  const Icon = categoryIcons[category];
  
  // Get available habits that aren't already active
  const allCategoryHabits = allHabitsByCategory[category].filter(
    h => !h.is_ramadan_specific || isRamadhanMode
  );
  const activeIds = new Set(activeHabits.map(h => h.id));
  const availableHabits = allCategoryHabits.filter(h => !activeIds.has(h.id));

  // Calculate progress
  const completedCount = activeHabits.filter(h => getTodayLog(h.id)?.isCompleted).length;
  const progressPercent = activeHabits.length > 0 
    ? (completedCount / activeHabits.length) * 100 
    : 0;

  if (activeHabits.length === 0 && !isExpanded) {
    return null; // Don't show empty categories in collapsed state
  }

  return (
    <motion.div layout>
      <Card className={`overflow-hidden transition-all ${isExpanded ? 'shadow-lg' : ''}`}>
        <CardContent className="p-0">
          {/* Header - Always visible */}
          <div 
            className={`p-3.5 cursor-pointer ${info.bgColor} ${isExpanded ? '' : 'hover:opacity-90'}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${info.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{info.label}</h3>
                  <Badge variant="secondary" className="text-xs bg-white/50 dark:bg-black/20">
                    {completedCount}/{activeHabits.length}
                  </Badge>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-white/30" />
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 space-y-2 border-t">
                  {/* Active Habits */}
                  {activeHabits.map((habit) => {
                    const todayLog = getTodayLog(habit.id);
                    const isCompleted = todayLog?.isCompleted || false;
                    const currentCount = todayLog?.completedCount || 0;
                    const targetCount = habit.target_count || 1;
                    const HabitIcon = iconMap[habit.icon] || Flame;

                    return (
                      <motion.div
                        key={habit.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${
                          isCompleted 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        {/* Toggle Button */}
                        <Button
                          variant={isCompleted ? "default" : "outline"}
                          size="icon"
                          className="h-9 w-9 rounded-lg flex-shrink-0"
                          onClick={() => toggleHabit(habit.id, targetCount)}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : targetCount > 1 ? (
                            <span className="text-xs font-bold">{currentCount}</span>
                          ) : (
                            <HabitIcon className="w-4 h-4" />
                          )}
                        </Button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isCompleted ? 'line-through opacity-60' : ''}`}>
                            {habit.name}
                          </p>
                          {targetCount > 1 && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Progress 
                                value={(currentCount / targetCount) * 100} 
                                className="h-1 flex-1" 
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {currentCount}/{targetCount}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveHabit(habit.id);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    );
                  })}

                  {/* Add More Habits Toggle */}
                  {availableHabits.length > 0 && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs text-muted-foreground h-8"
                        onClick={() => setShowAddHabits(!showAddHabits)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Tambah habit ({availableHabits.length} tersedia)
                      </Button>

                      <AnimatePresence>
                        {showAddHabits && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-1.5">
                              {availableHabits.map((habit) => (
                                <Button
                                  key={habit.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start h-9 text-xs"
                                  onClick={() => onAddHabit(habit)}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-2 text-primary" />
                                  {habit.name}
                                  {habit.is_ramadan_specific && (
                                    <Badge variant="outline" className="ml-auto text-[8px] px-1 bg-amber-500/10">
                                      🌙
                                    </Badge>
                                  )}
                                </Button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {activeHabits.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                      Belum ada habit aktif
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CategoryHabitCard;
