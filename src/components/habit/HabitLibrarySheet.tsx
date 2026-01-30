import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Flame, BookOpen, Heart, Target, Brain, Users, Wallet,
  ChevronRight, Plus, Check, X
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

const categoryOrder: HabitCategory[] = [
  'spiritual', 'belajar', 'kesehatan', 'produktivitas', 'mental', 'sosial', 'finansial'
];

interface HabitLibrarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: DefaultHabit[];
  isRamadhanMode?: boolean;
  onAddHabit: (habit: DefaultHabit) => void;
  onRemoveHabit: (habitId: string) => void;
}

export const HabitLibrarySheet = ({
  open,
  onOpenChange,
  habits,
  isRamadhanMode = false,
  onAddHabit,
  onRemoveHabit,
}: HabitLibrarySheetProps) => {
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null);
  const { getTodayLog } = useLocalHabitLogs();

  const habitsByCategory = categoryOrder.reduce((acc, category) => {
    acc[category] = habits.filter(h => h.category === category);
    return acc;
  }, {} as Record<HabitCategory, DefaultHabit[]>);

  const getCategoryProgress = (category: HabitCategory) => {
    const categoryHabits = habitsByCategory[category];
    if (categoryHabits.length === 0) return { completed: 0, total: 0, percent: 0 };
    
    const completed = categoryHabits.filter(h => getTodayLog(h.id)?.isCompleted).length;
    return {
      completed,
      total: categoryHabits.length,
      percent: Math.round((completed / categoryHabits.length) * 100),
    };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <AnimatePresence mode="wait">
          {selectedCategory ? (
            <CategoryDetailView
              key="detail"
              category={selectedCategory}
              habits={habitsByCategory[selectedCategory]}
              allHabits={allHabitsByCategory[selectedCategory].filter(
                h => !h.is_ramadan_specific || isRamadhanMode
              )}
              isRamadhanMode={isRamadhanMode}
              onBack={() => setSelectedCategory(null)}
              onAddHabit={onAddHabit}
              onRemoveHabit={onRemoveHabit}
            />
          ) : (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Habit Library</SheetTitle>
                <SheetDescription>
                  Pilih kategori untuk melihat & mengelola habit
                </SheetDescription>
              </SheetHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {categoryOrder.map((category) => {
                    const info = categoryInfo[category];
                    const Icon = categoryIcons[category];
                    const progress = getCategoryProgress(category);
                    const hasHabits = habitsByCategory[category].length > 0;

                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            hasHabits ? 'border-primary/20' : ''
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.bgColor}`}>
                                <Icon className={`w-6 h-6 ${info.color}`} />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-sm">{info.label}</h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {progress.completed}/{progress.total}
                                  </Badge>
                                </div>
                                {hasHabits && (
                                  <Progress 
                                    value={progress.percent} 
                                    className="h-1.5"
                                  />
                                )}
                                {!hasHabits && (
                                  <p className="text-xs text-muted-foreground">
                                    Belum ada habit
                                  </p>
                                )}
                              </div>

                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

interface CategoryDetailViewProps {
  category: HabitCategory;
  habits: DefaultHabit[];
  allHabits: DefaultHabit[];
  isRamadhanMode: boolean;
  onBack: () => void;
  onAddHabit: (habit: DefaultHabit) => void;
  onRemoveHabit: (habitId: string) => void;
}

const CategoryDetailView = ({
  category,
  habits,
  allHabits,
  isRamadhanMode,
  onBack,
  onAddHabit,
  onRemoveHabit,
}: CategoryDetailViewProps) => {
  const info = categoryInfo[category];
  const Icon = categoryIcons[category];
  const { getTodayLog, toggleHabit } = useLocalHabitLogs();

  const activeHabitIds = new Set(habits.map(h => h.id));
  const availableHabits = allHabits.filter(h => !activeHabitIds.has(h.id));

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className={`p-4 border-b ${info.bgColor}`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/50`}>
            <Icon className={`w-5 h-5 ${info.color}`} />
          </div>
          <div>
            <h2 className="font-bold text-lg">{info.label}</h2>
            <p className="text-xs text-muted-foreground">{habits.length} habit aktif</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Active Habits */}
        {habits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              HABIT AKTIF
            </h3>
            <div className="space-y-2">
              {habits.map((habit) => {
                const todayLog = getTodayLog(habit.id);
                const isCompleted = todayLog?.isCompleted || false;

                return (
                  <Card 
                    key={habit.id}
                    className={`transition-all ${isCompleted ? 'bg-primary/5 border-primary/30' : ''}`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Button
                        variant={isCompleted ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 rounded-full flex-shrink-0"
                        onClick={() => toggleHabit(habit.id, habit.target_count || 1)}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border-2" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isCompleted ? 'line-through opacity-60' : ''}`}>
                          {habit.name}
                        </p>
                        {habit.is_ramadan_specific && (
                          <Badge variant="outline" className="text-[9px] mt-0.5 bg-amber-500/10 text-amber-600">
                            Ramadan
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/70 hover:text-destructive"
                        onClick={() => onRemoveHabit(habit.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Habits */}
        {availableHabits.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              TAMBAH HABIT
            </h3>
            <div className="space-y-2">
              {availableHabits.map((habit) => (
                <Card 
                  key={habit.id}
                  className="cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => onAddHabit(habit)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${info.bgColor}`}>
                      <Plus className={`w-4 h-4 ${info.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{habit.name}</p>
                      {habit.is_ramadan_specific && (
                        <Badge variant="outline" className="text-[9px] mt-0.5 bg-amber-500/10 text-amber-600">
                          Ramadan
                        </Badge>
                      )}
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {habits.length === 0 && availableHabits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada habit tersedia</p>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default HabitLibrarySheet;
