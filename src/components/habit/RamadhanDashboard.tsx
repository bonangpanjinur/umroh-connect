import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Moon, Star, Heart, Activity, Flame, Calendar, 
  TrendingUp, Sparkles, AlertCircle, BookOpen
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRamadanDashboard, getRandomQuote } from '@/hooks/useRamadhanDashboard';
import { useIbadahStats } from '@/hooks/useIbadahHabits';
import { useSedekahStats } from '@/hooks/useSedekah';
import { useExerciseStats } from '@/hooks/useOlahraga';
import { useState, useEffect } from 'react';

export const RamadhanDashboard = () => {
  const { user } = useAuthContext();
  const { data: dashboard } = useRamadanDashboard(user?.id);
  const { data: ibadahStats } = useIbadahStats(user?.id);
  const { data: sedekahStats } = useSedekahStats(user?.id);
  const { data: exerciseStats } = useExerciseStats(user?.id);
  const [quote, setQuote] = useState(getRandomQuote());

  useEffect(() => {
    // Change quote every 30 seconds
    const interval = setInterval(() => {
      setQuote(getRandomQuote());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="p-4 text-center">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Moon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Masuk untuk Dashboard Ramadhan</h3>
            <p className="text-muted-foreground text-sm">
              Login untuk melihat progress Ramadhan Anda
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayOfRamadan = dashboard?.dayOfRamadan || 1;
  const totalDays = dashboard?.totalDays || 30;
  const ramadanProgress = (dayOfRamadan / totalDays) * 100;

  return (
    <div className="pb-24 space-y-4">
      {/* Ramadan Header */}
      <div className="px-4 pt-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-5 text-white"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-4 right-4">
            <Moon className="w-8 h-8 text-yellow-300" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium opacity-90">Dashboard Ramadhan</span>
              {dashboard?.isLast10Nights && (
                <Badge className="bg-yellow-400 text-yellow-900 text-xs animate-pulse">
                  🌙 10 Malam Terakhir
                </Badge>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-1">
              Hari ke-{dayOfRamadan}
            </h2>
            <p className="text-sm opacity-80 mb-4">dari {totalDays} hari Ramadhan</p>
            
            <Progress value={ramadanProgress} className="h-2 bg-white/20" />
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-xs opacity-80">Streak Terbaik</span>
                </div>
                <p className="text-2xl font-bold">{dashboard?.bestStreak || 0} hari</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-300" />
                  <span className="text-xs opacity-80">Streak Sekarang</span>
                </div>
                <p className="text-2xl font-bold">{dashboard?.currentStreak || 0} hari</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Status */}
      <div className="px-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Status Hari Ini
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Ibadah Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`${ibadahStats?.todayProgress === 100 ? 'border-primary bg-primary/5' : ''}`}>
              <CardContent className="p-3 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  ibadahStats?.todayProgress === 100 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">Ibadah</p>
                <p className="text-lg font-bold text-primary">{ibadahStats?.todayProgress || 0}%</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sedekah Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`${sedekahStats?.hasSedekahToday ? 'border-emerald-500 bg-emerald-500/5' : ''}`}>
              <CardContent className="p-3 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  sedekahStats?.hasSedekahToday ? 'bg-emerald-500 text-white' : 'bg-muted'
                }`}>
                  <Heart className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">Sedekah</p>
                <p className="text-lg font-bold text-emerald-600">
                  {sedekahStats?.hasSedekahToday ? '✓' : '-'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Exercise Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`${exerciseStats?.hasExerciseToday ? 'border-blue-500 bg-blue-500/5' : ''}`}>
              <CardContent className="p-3 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  exerciseStats?.hasExerciseToday ? 'bg-blue-500 text-white' : 'bg-muted'
                }`}>
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">Olahraga</p>
                <p className="text-lg font-bold text-blue-600">
                  {exerciseStats?.hasExerciseToday ? '✓' : '-'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Notifications */}
      {!sedekahStats?.hasSedekahToday && (
        <div className="px-4">
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Belum sedekah hari ini</p>
                <p className="text-xs text-muted-foreground">Yuk sisihkan sedikit rezeki untuk berbagi 💝</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Ringkasan Ramadhan
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Ibadah Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Ibadah</span>
              </div>
              <p className="text-2xl font-bold">{ibadahStats?.completedToday || 0}/{ibadahStats?.totalHabits || 0}</p>
              <p className="text-xs text-muted-foreground">ibadah hari ini</p>
              <Progress value={ibadahStats?.todayProgress || 0} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          {/* Sedekah Total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm font-medium">Sedekah</span>
              </div>
              <p className="text-2xl font-bold">Rp {((sedekahStats?.totalAmount || 0) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">{sedekahStats?.totalCount || 0}x sedekah</p>
            </CardContent>
          </Card>

          {/* Exercise Total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Olahraga</span>
              </div>
              <p className="text-2xl font-bold">{exerciseStats?.totalMinutes || 0}</p>
              <p className="text-xs text-muted-foreground">menit total</p>
            </CardContent>
          </Card>

          {/* Active Days */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium">Konsistensi</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(((ibadahStats?.weeklyRate || 0)))}%</p>
              <p className="text-xs text-muted-foreground">rate mingguan</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="px-4">
        <motion.div
          key={quote.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm italic leading-relaxed">"{quote.text}"</p>
                  <p className="text-xs text-muted-foreground mt-2">— {quote.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lailatul Qadar Mode */}
      {dashboard?.isLast10Nights && (
        <div className="px-4">
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-300 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    🌙 Mode Lailatul Qadar Aktif
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Malam yang lebih baik dari 1000 bulan. Perbanyak ibadah!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RamadhanDashboard;
