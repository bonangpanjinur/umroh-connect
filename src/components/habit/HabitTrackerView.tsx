import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, BookOpen, Heart, Target, Brain, Users, Wallet,
  Plus, Settings2, ChevronRight, Sparkles, Circle
} from 'lucide-react';
import { DefaultHabit, HabitCategory, categoryInfo, allHabitsByCategory } from '@/data/defaultHabits';
import { useLocalHabits, useLocalHabitLogs } from '@/hooks/useLocalHabitTracking';
import CategoryHabitList from './CategoryHabitList';
import TadarusView from './TadarusView';
import MealTrackingView from './MealTrackingView';
import DzikirStatsView from './DzikirStatsView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const categoryOrder: HabitCategory[] = [
  'spiritual',
  'belajar', 
  'kesehatan',
  'produktivitas',
  'mental',
  'sosial',
  'finansial'
];

const categoryIcons: Record<HabitCategory, any> = {
  spiritual: Flame,
  belajar: BookOpen,
  kesehatan: Heart,
  produktivitas: Target,
  mental: Brain,
  sosial: Users,
  finansial: Wallet,
};

interface HabitTrackerViewProps {
  onOpenTasbih?: () => void;
  isRamadhanMode?: boolean;
}

export const HabitTrackerView = ({ onOpenTasbih, isRamadhanMode = false }: HabitTrackerViewProps) => {
  const [subTab, setSubTab] = useState('habits');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    spiritual: true,
    belajar: true,
    kesehatan: true,
    produktivitas: false,
    mental: false,
    sosial: false,
    finansial: false,
  });
  const [showManageModal, setShowManageModal] = useState(false);
  
  const { habits, addHabit, removeHabit, isLoading } = useLocalHabits(isRamadhanMode);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const habitsByCategory = categoryOrder.reduce((acc, category) => {
    acc[category] = habits.filter(h => h.category === category);
    return acc;
  }, {} as Record<HabitCategory, DefaultHabit[]>);

  // Count non-empty categories
  const activeCategoriesCount = categoryOrder.filter(cat => habitsByCategory[cat].length > 0).length;

  return (
    <div className="space-y-3">
      {/* Sub-navigation: Habits, Tadarus, Makan, Dzikir */}
      <div className="px-4 pt-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'habits', label: 'Habit', icon: Circle },
            { id: 'tadarus', label: 'Tadarus', icon: BookOpen },
            { id: 'makan', label: 'Makan', icon: Heart },
            { id: 'dzikir', label: 'Dzikir', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 h-8 text-xs gap-1.5 ${
                  isActive ? 'bg-primary' : ''
                }`}
                onClick={() => setSubTab(tab.id)}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </Button>
            );
          })}
          
          {/* Manage Button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 text-xs gap-1.5 text-muted-foreground"
            onClick={() => setShowManageModal(true)}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'habits' && (
          <motion.div
            key="habits"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 space-y-4"
          >
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
              <>
                {categoryOrder.map((category) => {
                  const categoryHabits = habitsByCategory[category];
                  if (categoryHabits.length === 0) return null;
                  
                  return (
                    <CategoryHabitList
                      key={category}
                      category={category}
                      habits={categoryHabits}
                      isRamadhanMode={isRamadhanMode}
                      onAddHabit={addHabit}
                      isExpanded={expandedCategories[category]}
                      onToggleExpand={() => toggleCategory(category)}
                    />
                  );
                })}

                {/* Add Category Card */}
                <Card 
                  className="border-dashed cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setShowManageModal(true)}
                >
                  <CardContent className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Kelola Habit</span>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        )}

        {subTab === 'tadarus' && (
          <motion.div
            key="tadarus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            <TadarusView />
          </motion.div>
        )}

        {subTab === 'makan' && (
          <motion.div
            key="makan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            <MealTrackingView />
          </motion.div>
        )}

        {subTab === 'dzikir' && (
          <motion.div
            key="dzikir"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            <DzikirStatsView onOpenTasbih={onOpenTasbih} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Habits Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Kelola Habit</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih kategori untuk menambah atau menghapus habit sesuai kebutuhanmu.
            </p>
            
            {categoryOrder.map((category) => {
              const info = categoryInfo[category];
              const Icon = categoryIcons[category];
              const categoryHabits = habitsByCategory[category];
              const allCategoryHabits = allHabitsByCategory[category].filter(
                h => !h.is_ramadan_specific || isRamadhanMode
              );
              
              return (
                <Card key={category} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`p-3 ${info.bgColor} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${info.color}`} />
                        <span className="font-medium text-sm">{info.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {categoryHabits.length}/{allCategoryHabits.length}
                      </Badge>
                    </div>
                    <div className="p-2 space-y-1">
                      {allCategoryHabits.map((habit) => {
                        const isActive = habits.some(h => h.id === habit.id);
                        return (
                          <div 
                            key={habit.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              if (isActive) {
                                removeHabit(habit.id);
                              } else {
                                addHabit(habit);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full border-2 ${
                                isActive ? 'bg-primary border-primary' : 'border-muted-foreground'
                              }`} />
                              <span className="text-sm">{habit.name}</span>
                              {habit.is_ramadan_specific && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600">
                                  Ramadan
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitTrackerView;
