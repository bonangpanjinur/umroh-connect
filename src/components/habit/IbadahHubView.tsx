import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, Moon, Sparkles, Crown, Zap, ChevronRight, Plus,
  BookOpen, Utensils, Heart, BarChart3, Cloud, Sunset
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PremiumUpgradeModal } from '@/components/premium/PremiumUpgradeModal';
import { useIsPremium } from '@/hooks/usePremiumSubscription';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { useLocalHabits, useLocalHabitStats, useLocalWeeklyProgress } from '@/hooks/useLocalHabitTracking';
import { useMoodTracking } from '@/hooks/useMoodTracking';
import { isCurrentlyRamadan, getDaysUntilIdulFitri } from '@/hooks/useRamadhanDashboard';
import TodayHabitsList from './TodayHabitsList';
import HabitLibrarySheet from './HabitLibrarySheet';
import TadarusView from './TadarusView';
import MealTrackingView from './MealTrackingView';
import DzikirStatsView from './DzikirStatsView';
import SedekahView from './SedekahView';
import RamadhanDashboard from './RamadhanDashboard';

interface IbadahHubViewProps {
  onOpenTasbih?: () => void;
  onOpenQuran?: () => void;
  onNavigateToAuth?: () => void;
}

export const IbadahHubView = ({ onOpenTasbih, onOpenQuran, onNavigateToAuth }: IbadahHubViewProps) => {
  const { user } = useAuthContext();
  const { isPremium } = useIsPremium();
  const { isInTrial, daysRemaining, hasEverStartedTrial, startTrial } = useFreeTrial();
  const isRamadan = isCurrentlyRamadan();
  
  const [isRamadhanMode, setIsRamadhanMode] = useState(() => {
    const saved = localStorage.getItem('ramadhan_mode');
    if (saved !== null) return saved === 'true';
    return isRamadan; // Auto-detect
  });

  // Default to ramadhan tab when in ramadhan mode
  const [activeTab, setActiveTab] = useState(() => isRamadhanMode ? 'ramadhan' : 'ibadah');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showHabitLibrary, setShowHabitLibrary] = useState(false);

  const { habits, addHabit, removeHabit } = useLocalHabits(isRamadhanMode);
  const stats = useLocalHabitStats();
  const weeklyProgress = useLocalWeeklyProgress();
  const { todayMood, getMoodConfig } = useMoodTracking();

  // Quick actions state
  const [quickActions, setQuickActions] = useState<Record<string, boolean>>(() => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const saved = JSON.parse(localStorage.getItem('ramadhan_quick_actions') || '{}');
      return saved[today] || {};
    } catch { return {}; }
  });

  const toggleQuickAction = (action: string) => {
    setQuickActions(prev => {
      const updated = { ...prev, [action]: !prev[action] };
      const today = format(new Date(), 'yyyy-MM-dd');
      const all = JSON.parse(localStorage.getItem('ramadhan_quick_actions') || '{}');
      all[today] = updated;
      localStorage.setItem('ramadhan_quick_actions', JSON.stringify(all));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('ramadhan_mode', isRamadhanMode.toString());
  }, [isRamadhanMode]);

  const currentMoodConfig = todayMood ? getMoodConfig(todayMood.mood) : null;
  const daysToIdulFitri = getDaysUntilIdulFitri();

  // Check if user has been active for 7+ days for natural CTA
  const daysActive = (() => {
    try {
      const first = localStorage.getItem('first_tracker_use');
      if (!first) { localStorage.setItem('first_tracker_use', new Date().toISOString()); return 0; }
      return Math.floor((Date.now() - new Date(first).getTime()) / 86400000);
    } catch { return 0; }
  })();

  return (
    <div className="pb-24">
      {/* Header Stats Card */}
      <div className="px-4 pt-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl p-4 text-primary-foreground ${
            currentMoodConfig 
              ? `bg-gradient-to-br ${currentMoodConfig.bg.replace('/10', '')} from-primary via-primary/90 to-primary/70`
              : 'bg-gradient-to-br from-primary via-primary/90 to-primary/70'
          }`}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm opacity-90">
                {format(new Date(), 'EEEE, d MMM', { locale: id })}
              </span>
              <div className="flex items-center gap-2">
                {todayMood && (
                  <Badge className="bg-white/20 text-white text-[10px] gap-1">
                    {currentMoodConfig?.label}
                  </Badge>
                )}
                {isRamadhanMode && (
                  <Badge className="bg-amber-500/80 text-white text-[10px] gap-1">
                    <Moon className="h-3 w-3" />
                    Ramadan
                  </Badge>
                )}
                {isPremium ? (
                  <Badge className="bg-white/20 text-white gap-1 text-[10px]">
                    <Crown className="h-3 w-3" />
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-5 px-2 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => setShowPremiumModal(true)}
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-1">
              {isRamadhanMode ? `🌙 Ramadhan Hari Ini` : 'Hari Ini'}
            </h2>
            {isRamadhanMode && isRamadan && (
              <p className="text-xs opacity-80 mb-1">
                <Sunset className="w-3 h-3 inline mr-1" />
                {daysToIdulFitri} hari menuju Idul Fitri
              </p>
            )}
            {todayMood && currentMoodConfig && (
              <p className="text-xs opacity-80 mb-2">{currentMoodConfig.message}</p>
            )}
            
            {/* Stats */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-bold">
                  {stats.completedToday}
                  <span className="text-lg opacity-70">/{stats.totalHabits}</span>
                </p>
                <p className="text-xs opacity-80">habit selesai</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span className="font-bold">{stats.currentStreak}</span>
                  </div>
                  <p className="text-[10px] opacity-70">streak</p>
                </div>
                <div className="text-center">
                  <span className="font-bold">{stats.weeklyRate}%</span>
                  <p className="text-[10px] opacity-70">minggu ini</p>
                </div>
              </div>
            </div>
            
            <Progress value={stats.todayProgress} className="h-2 bg-white/20" />

            {/* Mini Weekly Chart */}
            <div className="mt-3 flex justify-between items-end h-6 gap-0.5">
              {weeklyProgress.map((day, i) => (
                <motion.div
                  key={day.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(20, (day.completedCount / Math.max(stats.totalHabits, 1)) * 100)}%` }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex-1 rounded-t ${
                    day.isToday ? 'bg-white' : day.completedCount > 0 ? 'bg-white/50' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {weeklyProgress.map((day) => (
                <span 
                  key={day.date} 
                  className={`text-[8px] flex-1 text-center ${day.isToday ? 'text-white font-bold' : 'text-white/50'}`}
                >
                  {day.dayName}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Ramadhan */}
      {isRamadhanMode && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'sahur', label: '🍚 Sahur', emoji: '🍚' },
              { id: 'berbuka', label: '🌅 Berbuka', emoji: '🌅' },
              { id: 'tarawih', label: '🕌 Tarawih', emoji: '🕌' },
              { id: 'tadarus', label: '📖 Tadarus', emoji: '📖' },
            ].map(action => (
              <Button
                key={action.id}
                variant={quickActions[action.id] ? 'default' : 'outline'}
                size="sm"
                className={`flex-shrink-0 h-9 text-xs gap-1.5 ${
                  quickActions[action.id] ? 'bg-primary' : ''
                }`}
                onClick={() => toggleQuickAction(action.id)}
              >
                {action.label}
                {quickActions[action.id] && ' ✓'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Ramadhan Mode Toggle */}
      <div className="px-4 pt-3">
        <Card className={`transition-all duration-300 ${
          isRamadhanMode 
            ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-300 dark:border-amber-700' 
            : 'bg-muted/30'
        }`}>
          <CardContent className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isRamadhanMode ? 'bg-amber-500 text-white' : 'bg-muted'
              }`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Mode Ramadan</p>
                <p className="text-[10px] text-muted-foreground">
                  {isRamadhanMode ? 'Tarawih, Sahur, Puasa' : 'Aktifkan untuk Ramadan'}
                </p>
              </div>
            </div>
            <Switch 
              checked={isRamadhanMode} 
              onCheckedChange={(checked) => {
                setIsRamadhanMode(checked);
                if (checked) setActiveTab('ramadhan');
              }}
              className="data-[state=checked]:bg-amber-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Natural CTA instead of StorageIndicator */}
      {!isPremium && !isInTrial && daysActive >= 7 && (
        <div className="px-4 pt-2">
          <Card className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-200 dark:border-sky-800">
            <CardContent className="py-2.5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-500" />
                <span className="text-xs text-sky-700 dark:text-sky-300">
                  Simpan progress ke cloud agar tidak hilang
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-sky-600"
                onClick={() => setShowPremiumModal(true)}
              >
                Upgrade
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trial Banner */}
      {user && isInTrial && (
        <div className="px-4 pt-2">
          <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800">
            <CardContent className="py-2.5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                  Trial Premium: {daysRemaining} hari tersisa
                </span>
              </div>
              <Badge className="bg-violet-500 text-white text-[10px]">GRATIS</Badge>
            </CardContent>
          </Card>
        </div>
      )}
      {user && !hasEverStartedTrial && !isPremium && (
        <div className="px-4 pt-2">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">🎁 Coba Premium 30 Hari Gratis!</p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Cloud sync, kalkulator khatam, tips eksklusif</p>
              </div>
              <Button 
                size="sm" 
                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                onClick={() => startTrial.mutate()}
                disabled={startTrial.isPending}
              >
                Mulai Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs - Ramadhan first when active */}
      <div className="px-4 pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`w-full grid h-auto bg-muted/50 ${isRamadhanMode ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {isRamadhanMode && (
              <TabsTrigger value="ramadhan" className="text-xs py-2 gap-1 data-[state=active]:bg-background">
                <Moon className="w-3.5 h-3.5" />
                Ramadan
              </TabsTrigger>
            )}
            <TabsTrigger value="ibadah" className="text-xs py-2 gap-1 data-[state=active]:bg-background">
              <Flame className="w-3.5 h-3.5" />
              Ibadah
            </TabsTrigger>
            <TabsTrigger value="makan" className="text-xs py-2 gap-1 data-[state=active]:bg-background">
              <Utensils className="w-3.5 h-3.5" />
              Makan
            </TabsTrigger>
            <TabsTrigger value="sedekah" className="text-xs py-2 gap-1 data-[state=active]:bg-background">
              <Heart className="w-3.5 h-3.5" />
              Sedekah
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'ramadhan' && isRamadhanMode && (
            <motion.div
              key="ramadhan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RamadhanDashboard />
            </motion.div>
          )}

          {activeTab === 'ibadah' && (
            <motion.div
              key="ibadah"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <IbadahSubTabs
                habits={habits}
                isRamadhanMode={isRamadhanMode}
                onOpenTasbih={onOpenTasbih}
                onOpenQuran={onOpenQuran}
                onShowLibrary={() => setShowHabitLibrary(true)}
                stats={stats}
                weeklyProgress={weeklyProgress}
                onAddHabit={addHabit}
                onRemoveHabit={removeHabit}
              />
            </motion.div>
          )}

          {activeTab === 'makan' && (
            <motion.div
              key="makan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MealTrackingView isRamadhanMode={isRamadhanMode} />
            </motion.div>
          )}

          {activeTab === 'sedekah' && (
            <motion.div
              key="sedekah"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SedekahView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Habit Library Sheet */}
      <HabitLibrarySheet
        open={showHabitLibrary}
        onOpenChange={setShowHabitLibrary}
        habits={habits}
        isRamadhanMode={isRamadhanMode}
        onAddHabit={addHabit}
        onRemoveHabit={removeHabit}
      />

      {/* Premium Modal */}
      <PremiumUpgradeModal 
        open={showPremiumModal} 
        onOpenChange={setShowPremiumModal}
        onLoginRequired={onNavigateToAuth}
      />
    </div>
  );
};

// Sub-tabs component for Ibadah section
interface IbadahSubTabsProps {
  habits: any[];
  isRamadhanMode: boolean;
  onOpenTasbih?: () => void;
  onOpenQuran?: () => void;
  onShowLibrary: () => void;
  stats: any;
  weeklyProgress: any[];
  onAddHabit: (habit: any) => void;
  onRemoveHabit: (habitId: string) => void;
}

const IbadahSubTabs = ({ 
  habits, isRamadhanMode, onOpenTasbih, onOpenQuran, onShowLibrary,
  stats, weeklyProgress, onAddHabit, onRemoveHabit,
}: IbadahSubTabsProps) => {
  const [subTab, setSubTab] = useState('today');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'today', label: 'Hari Ini', icon: Flame },
          { id: 'tadarus', label: 'Tadarus', icon: BookOpen },
          { id: 'dzikir', label: 'Dzikir', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={`flex-shrink-0 h-8 text-xs gap-1.5 ${isActive ? '' : 'text-muted-foreground'}`}
              onClick={() => setSubTab(tab.id)}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'today' && (
          <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TodayHabitsList 
              habits={habits} isRamadhanMode={isRamadhanMode} stats={stats}
              weeklyProgress={weeklyProgress} onAddHabit={onAddHabit} onRemoveHabit={onRemoveHabit}
              onShowLibrary={onShowLibrary} onOpenTasbih={onOpenTasbih}
            />
          </motion.div>
        )}
        {subTab === 'tadarus' && (
          <motion.div key="tadarus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TadarusView onOpenQuran={onOpenQuran} />
          </motion.div>
        )}
        {subTab === 'dzikir' && (
          <motion.div key="dzikir" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DzikirStatsView onOpenTasbih={onOpenTasbih} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IbadahHubView;
