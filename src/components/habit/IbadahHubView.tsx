import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Flame, Heart, Activity, Moon, Sparkles, ArrowRight, Crown, 
  TrendingUp, Calendar, Zap
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PremiumUpgradeModal, StorageIndicator } from '@/components/premium/PremiumUpgradeModal';
import { useIsPremium } from '@/hooks/usePremiumSubscription';
import HabitTrackerView from './HabitTrackerView';
import SedekahView from './SedekahView';
import OlahragaView from './OlahragaView';
import RamadhanDashboard from './RamadhanDashboard';
import { useLocalHabitStats, useLocalWeeklyProgress } from '@/hooks/useLocalHabitTracking';

interface IbadahHubViewProps {
  onOpenTasbih?: () => void;
  onNavigateToAuth?: () => void;
}

export const IbadahHubView = ({ onOpenTasbih, onNavigateToAuth }: IbadahHubViewProps) => {
  const { user } = useAuthContext();
  const { isPremium } = useIsPremium();
  const [activeTab, setActiveTab] = useState('ibadah');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isRamadhanMode, setIsRamadhanMode] = useState(() => {
    const saved = localStorage.getItem('ramadhan_mode');
    return saved === 'true';
  });

  const stats = useLocalHabitStats();
  const weeklyProgress = useLocalWeeklyProgress();

  // Save Ramadhan mode to localStorage
  useEffect(() => {
    localStorage.setItem('ramadhan_mode', isRamadhanMode.toString());
  }, [isRamadhanMode]);

  return (
    <div className="pb-24">
      {/* Header with Stats Card */}
      <div className="px-4 pt-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4 text-primary-foreground"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            {/* Date & Mode */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Habit Tracker</span>
              </div>
              <div className="flex items-center gap-2">
                {isRamadhanMode && (
                  <Badge className="bg-amber-500/80 text-white text-[10px] gap-1">
                    <Moon className="h-3 w-3" />
                    Ramadan
                  </Badge>
                )}
                {isPremium ? (
                  <Badge className="bg-white/20 text-white gap-1 text-[10px]">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 px-2 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => setShowPremiumModal(true)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-1">
              {format(new Date(), 'EEEE, d MMMM', { locale: id })}
            </h2>
            
            {/* Stats Row */}
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs opacity-80">Progress Hari Ini</p>
                <p className="text-2xl font-bold">
                  {stats.completedToday}/{stats.totalHabits}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80">Streak</p>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span className="text-lg font-semibold">{stats.currentStreak}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Mingguan</p>
                <p className="text-lg font-semibold">{stats.weeklyRate}%</p>
              </div>
            </div>
            
            <Progress 
              value={stats.todayProgress} 
              className="mt-3 h-2 bg-white/20"
            />

            {/* Mini Weekly Chart */}
            <div className="mt-3 flex justify-between items-end h-8 gap-0.5">
              {weeklyProgress.map((day, i) => (
                <motion.div
                  key={day.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(15, (day.completedCount / Math.max(stats.totalHabits, 1)) * 100)}%` }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex-1 rounded-t ${
                    day.isToday 
                      ? 'bg-white' 
                      : day.completedCount > 0 ? 'bg-white/50' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {weeklyProgress.map((day) => (
                <span 
                  key={day.date} 
                  className={`text-[9px] flex-1 text-center ${
                    day.isToday ? 'text-white font-bold' : 'text-white/60'
                  }`}
                >
                  {day.dayName}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ramadhan Mode Toggle */}
      <div className="px-4 pt-3">
        <Card className={`transition-all duration-300 ${
          isRamadhanMode 
            ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-300 dark:border-amber-700' 
            : 'bg-muted/50'
        }`}>
          <CardContent className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isRamadhanMode 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-muted'
              }`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">Mode Ramadan</p>
                  {isRamadhanMode && (
                    <Badge className="bg-amber-500 text-white text-[9px] h-4">
                      Aktif
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isRamadhanMode 
                    ? 'Tarawih, Sahur, Puasa aktif' 
                    : 'Aktifkan untuk fitur Ramadan'}
                </p>
              </div>
            </div>
            <Switch 
              checked={isRamadhanMode} 
              onCheckedChange={setIsRamadhanMode}
              className="data-[state=checked]:bg-amber-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Ramadhan Dashboard Button (only when active) */}
      {isRamadhanMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pt-2"
        >
          <Button 
            variant="outline" 
            className="w-full justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400"
            onClick={() => setActiveTab('ramadhan')}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm">Dashboard Ramadan</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500" />
          </Button>
        </motion.div>
      )}

      {/* Storage Indicator */}
      <div className="px-4 pt-2">
        <StorageIndicator onUpgrade={() => setShowPremiumModal(true)} />
      </div>

      {/* Main Category Tabs - BELOW the green card */}
      <div className="px-4 pt-3 sticky top-0 bg-background z-20 pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="ibadah" className="text-xs py-2 gap-1">
              <Flame className="w-3.5 h-3.5" />
              Ibadah
            </TabsTrigger>
            <TabsTrigger value="sedekah" className="text-xs py-2 gap-1">
              <Heart className="w-3.5 h-3.5" />
              Sedekah
            </TabsTrigger>
            <TabsTrigger value="olahraga" className="text-xs py-2 gap-1">
              <Activity className="w-3.5 h-3.5" />
              Olahraga
            </TabsTrigger>
            {isRamadhanMode && (
              <TabsTrigger value="ramadhan" className="text-xs py-2 gap-1">
                <Moon className="w-3.5 h-3.5" />
                Ramadan
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'ibadah' && (
          <motion.div
            key="ibadah"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <HabitTrackerView 
              onOpenTasbih={onOpenTasbih} 
              isRamadhanMode={isRamadhanMode} 
            />
          </motion.div>
        )}

        {activeTab === 'sedekah' && (
          <motion.div
            key="sedekah"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <SedekahView />
          </motion.div>
        )}

        {activeTab === 'olahraga' && (
          <motion.div
            key="olahraga"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <OlahragaView isRamadhanMode={isRamadhanMode} />
          </motion.div>
        )}

        {activeTab === 'ramadhan' && isRamadhanMode && (
          <motion.div
            key="ramadhan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <RamadhanDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        open={showPremiumModal} 
        onOpenChange={setShowPremiumModal}
        onLoginRequired={onNavigateToAuth}
      />
    </div>
  );
};

export default IbadahHubView;
