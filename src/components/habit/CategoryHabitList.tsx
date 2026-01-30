import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, Circle, Plus, ChevronDown, ChevronUp,
  Clock, Book, Moon, Sunrise, Sunset, BookOpen, Heart,
  Utensils, Eye, Sparkles, Lightbulb, FileText, PenTool,
  Headphones, GraduationCap, Footprints, Dumbbell, Move, Smartphone,
  Droplets, Apple, Target, CheckSquare, ClipboardCheck,
  Calendar, Home, Brain, Smile, Shield,
  Users, MessageCircle, 
  Receipt, Coins, Ban, BarChart3, Flame
} from 'lucide-react';
import { DefaultHabit, HabitCategory, categoryInfo, allHabitsByCategory } from '@/data/defaultHabits';
import { useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const iconMap: Record<string, any> = {
  clock: Clock,
  book: Book,
  moon: Moon,
  sunrise: Sunrise,
  sunset: Sunset,
  'book-open': BookOpen,
  heart: Heart,
  utensils: Utensils,
  eye: Eye,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  'file-text': FileText,
  'pen-tool': PenTool,
  headphones: Headphones,
  'graduation-cap': GraduationCap,
  footprints: Footprints,
  dumbbell: Dumbbell,
  move: Move,
  droplets: Droplets,
  apple: Apple,
  target: Target,
  'check-square': CheckSquare,
  'clipboard-check': ClipboardCheck,
  calendar: Calendar,
  home: Home,
  focus: Target,
  brain: Brain,
  smile: Smile,
  shield: Shield,
  'smartphone-off': Smartphone,
  users: Users,
  'hand-helping': Heart,
  'hand-heart': Heart,
  'message-circle': MessageCircle,
  'heart-handshake': Heart,
  receipt: Receipt,
  'piggy-bank': Coins,
  coins: Coins,
  ban: Ban,
  'chart-bar': BarChart3,
  flame: Flame,
};

interface CategoryHabitListProps {
  category: HabitCategory;
  habits: DefaultHabit[];
  isRamadhanMode?: boolean;
  onAddHabit?: (habit: DefaultHabit) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const CategoryHabitList = ({
  category,
  habits,
  isRamadhanMode = false,
  onAddHabit,
  isExpanded = true,
  onToggleExpand,
}: CategoryHabitListProps) => {
  const info = categoryInfo[category];
  const { getTodayLog, toggleHabit, resetHabit } = useLocalHabitLogs();
  const [showAddModal, setShowAddModal] = useState(false);

  // Get available habits to add (not already in user's list)
  const availableHabits = (allHabitsByCategory[category] || []).filter(
    h => !habits.find(uh => uh.id === h.id) && (!h.is_ramadan_specific || isRamadhanMode)
  );

  const handleToggle = (habit: DefaultHabit) => {
    toggleHabit(habit.id, habit.target_count || 1);
  };

  const completedCount = habits.filter(h => {
    const log = getTodayLog(h.id);
    return log?.isCompleted;
  }).length;

  const CategoryIcon = iconMap[info.icon] || Flame;

  if (habits.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Category Header */}
      <motion.div
        className="flex items-center justify-between px-1 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${info.bgColor}`}>
            <CategoryIcon className={`w-4 h-4 ${info.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{info.label}</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{habits.length} selesai
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableHabits.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
          {onToggleExpand && (
            isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </motion.div>

      {/* Habit Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
          >
            {habits.map((habit, index) => {
              const Icon = iconMap[habit.icon] || Circle;
              const todayLog = getTodayLog(habit.id);
              const isCompleted = todayLog?.isCompleted || false;
              const currentCount = todayLog?.completedCount || 0;
              const targetCount = habit.target_count || 1;
              const progress = targetCount > 1 
                ? (currentCount / targetCount) * 100 
                : isCompleted ? 100 : 0;

              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card 
                    className={`transition-all duration-200 cursor-pointer ${
                      isCompleted 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'hover:border-primary/20'
                    }`}
                    onClick={() => handleToggle(habit)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted 
                              ? 'bg-primary text-primary-foreground' 
                              : info.bgColor
                          }`}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className={`w-4 h-4 ${info.color}`} />
                          )}
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium text-sm truncate ${
                              isCompleted ? 'text-primary' : ''
                            }`}>
                              {habit.name}
                            </h4>
                            {habit.is_ramadan_specific && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                Ramadan
                              </Badge>
                            )}
                          </div>
                          
                          {targetCount > 1 && (
                            <div className="mt-1.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                                <span>{currentCount}/{targetCount}</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          )}
                        </div>

                        <motion.div
                          className={`flex-shrink-0 ${
                            isCompleted ? 'text-primary' : 'text-muted-foreground'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Habit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>Tambah Habit {info.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[50vh]">
            {availableHabits.map((habit) => {
              const Icon = iconMap[habit.icon] || Circle;
              return (
                <Card 
                  key={habit.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => {
                    onAddHabit?.(habit);
                    setShowAddModal(false);
                  }}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${info.bgColor}`}>
                      <Icon className={`w-4 h-4 ${info.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{habit.name}</p>
                      {habit.name_arabic && (
                        <p className="text-xs text-muted-foreground font-arabic">{habit.name_arabic}</p>
                      )}
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
            {availableHabits.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Semua habit sudah ditambahkan
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryHabitList;
