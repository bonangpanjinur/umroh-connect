import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Moon, Sun, Sunrise, Sunset, Book, BookOpen, Heart, 
  Repeat, Home, Utensils, Flame, Calendar, TrendingUp,
  CheckCircle2, Circle, Sparkles, Star, BookMarked
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHabitsWithProgress, useToggleHabit, useIncrementHabit, useIbadahStats, useWeeklyProgress } from '@/hooks/useIbadahHabits';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import TadarusView from './TadarusView';
import MealTrackingView from './MealTrackingView';
import DzikirStatsView from './DzikirStatsView';

const iconMap: Record<string, any> = {
  sun: Sun,
  moon: Moon,
  sunrise: Sunrise,
  sunset: Sunset,
  book: Book,
  'book-open': BookOpen,
  heart: Heart,
  repeat: Repeat,
  home: Home,
  utensils: Utensils,
};

const categoryColors: Record<string, string> = {
  wajib: 'bg-primary/10 text-primary border-primary/20',
  sunnah: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  dzikir: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  ramadan: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const categoryLabels: Record<string, string> = {
  wajib: 'Wajib',
  sunnah: 'Sunnah',
  dzikir: 'Dzikir',
  ramadan: 'Ramadan',
};

interface HabitViewProps {
  onOpenTasbih?: () => void;
}

export const HabitView = ({ onOpenTasbih }: HabitViewProps) => {
  const { user } = useAuthContext();
  const [mainTab, setMainTab] = useState('ibadah');
  const [activeTab, setActiveTab] = useState('semua');
  const [showRamadan, setShowRamadan] = useState(true);
  
  const { data: habits, isLoading } = useHabitsWithProgress(user?.id, showRamadan);
  const { data: stats } = useIbadahStats(user?.id);
  const { data: weeklyProgress } = useWeeklyProgress(user?.id);
  const toggleHabit = useToggleHabit();
  const incrementHabit = useIncrementHabit();

  const filteredHabits = activeTab === 'semua' 
    ? habits 
    : habits.filter(h => h.category === activeTab);

  const handleToggle = (habit: any) => {
    if (!user) return;
    
    if (habit.target_count > 1) {
      const currentCount = habit.todayLog?.completed_count || 0;
      if (currentCount < habit.target_count) {
        incrementHabit.mutate({
          userId: user.id,
          habitId: habit.id,
          currentCount,
          targetCount: habit.target_count,
        });
      }
    } else {
      toggleHabit.mutate({
        userId: user.id,
        habitId: habit.id,
        isCompleted: !habit.todayLog?.is_completed,
        targetCount: habit.target_count,
      });
    }
  };

  const handleReset = (habit: any) => {
    if (!user) return;
    toggleHabit.mutate({
      userId: user.id,
      habitId: habit.id,
      isCompleted: false,
      completedCount: 0,
      targetCount: habit.target_count,
    });
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Masuk untuk Melacak Ibadah</h3>
            <p className="text-muted-foreground text-sm">
              Login untuk mulai tracking ibadah harian Anda dan melihat progress
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Main Tabs */}
      <div className="px-4 pt-2 sticky top-0 bg-background z-20">
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="ibadah" className="text-xs py-2 gap-1">
              <Flame className="w-3 h-3" />
              Ibadah
            </TabsTrigger>
            <TabsTrigger value="tadarus" className="text-xs py-2 gap-1">
              <BookMarked className="w-3 h-3" />
              Tadarus
            </TabsTrigger>
            <TabsTrigger value="makan" className="text-xs py-2 gap-1">
              <Utensils className="w-3 h-3" />
              Makan
            </TabsTrigger>
            <TabsTrigger value="dzikir" className="text-xs py-2 gap-1">
              <Circle className="w-3 h-3" />
              Dzikir
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {mainTab === 'ibadah' && (
          <motion.div
            key="ibadah"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Header Stats */}
            <div className="px-4 pt-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4 text-primary-foreground">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-5 h-5" />
                    <span className="text-sm font-medium opacity-90">Habit Ibadah</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">
                    {format(new Date(), 'EEEE, d MMMM', { locale: id })}
                  </h2>
                  
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-sm opacity-80">Progress Hari Ini</p>
                      <p className="text-3xl font-bold">
                        {stats?.completedToday || 0}/{stats?.totalHabits || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Mingguan</p>
                      <p className="text-xl font-semibold">{stats?.weeklyRate || 0}%</p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={stats?.todayProgress || 0} 
                    className="mt-3 h-2 bg-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Weekly Progress Chart */}
            <div className="px-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Progress 7 Hari Terakhir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end h-20 gap-1">
                    {weeklyProgress?.map((day, i) => (
                      <motion.div
                        key={day.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(20, (day.completedCount / (stats?.totalHabits || 1)) * 100)}%` }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex-1 rounded-t-md ${
                          day.isToday 
                            ? 'bg-primary' 
                            : 'bg-primary/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {weeklyProgress?.map((day) => (
                      <span 
                        key={day.date} 
                        className={`text-xs flex-1 text-center ${
                          day.isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {day.dayName}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ramadan Toggle */}
            <div className="px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Tampilkan Ibadah Ramadan</span>
              </div>
              <Switch 
                checked={showRamadan} 
                onCheckedChange={setShowRamadan}
              />
            </div>

            {/* Category Tabs */}
            <div className="px-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-5 h-auto">
                  <TabsTrigger value="semua" className="text-xs py-2">Semua</TabsTrigger>
                  <TabsTrigger value="wajib" className="text-xs py-2">Wajib</TabsTrigger>
                  <TabsTrigger value="sunnah" className="text-xs py-2">Sunnah</TabsTrigger>
                  <TabsTrigger value="dzikir" className="text-xs py-2">Dzikir</TabsTrigger>
                  <TabsTrigger value="ramadan" className="text-xs py-2">Ramadan</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Habits List */}
            <div className="px-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-full" />
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                              <div className="h-3 bg-muted rounded w-1/3" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  filteredHabits?.map((habit, index) => {
                    const Icon = iconMap[habit.icon || 'star'] || Star;
                    const isCompleted = habit.todayLog?.is_completed;
                    const currentCount = habit.todayLog?.completed_count || 0;
                    const progress = habit.target_count > 1 
                      ? (currentCount / habit.target_count) * 100 
                      : isCompleted ? 100 : 0;

                    return (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <Card 
                          className={`transition-all duration-300 cursor-pointer hover:shadow-md ${
                            isCompleted 
                              ? 'bg-primary/5 border-primary/30' 
                              : 'hover:border-primary/20'
                          }`}
                          onClick={() => handleToggle(habit)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <motion.div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isCompleted 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                                whileTap={{ scale: 0.9 }}
                                animate={{ 
                                  scale: isCompleted ? [1, 1.1, 1] : 1,
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <Icon className="w-5 h-5" />
                                )}
                              </motion.div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-medium truncate ${
                                    isCompleted ? 'text-primary' : ''
                                  }`}>
                                    {habit.name}
                                  </h3>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1.5 py-0 ${categoryColors[habit.category]}`}
                                  >
                                    {categoryLabels[habit.category]}
                                  </Badge>
                                </div>
                                
                                {habit.name_arabic && (
                                  <p className="text-sm text-muted-foreground font-arabic mb-1">
                                    {habit.name_arabic}
                                  </p>
                                )}
                                
                                {habit.target_count > 1 && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                      <span>{currentCount} / {habit.target_count}</span>
                                      <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                  </div>
                                )}
                              </div>

                              <motion.button
                                className={`p-2 rounded-full ${
                                  isCompleted 
                                    ? 'text-primary' 
                                    : 'text-muted-foreground'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isCompleted && habit.target_count > 1) {
                                    handleReset(habit);
                                  } else {
                                    handleToggle(habit);
                                  }
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  <Circle className="w-6 h-6" />
                                )}
                              </motion.button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>

              {!isLoading && filteredHabits?.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Tidak ada ibadah di kategori ini
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {mainTab === 'tadarus' && (
          <motion.div
            key="tadarus"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 pt-4"
          >
            <TadarusView />
          </motion.div>
        )}

        {mainTab === 'makan' && (
          <motion.div
            key="makan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 pt-4"
          >
            <MealTrackingView />
          </motion.div>
        )}

        {mainTab === 'dzikir' && (
          <motion.div
            key="dzikir"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 pt-4"
          >
            <DzikirStatsView onOpenTasbih={onOpenTasbih || (() => {})} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitView;
