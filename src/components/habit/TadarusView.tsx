import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  useQuranSurahs, 
  useTodayQuranLogs, 
  useQuranStats, 
  useDeleteQuranLog,
  useQuranLastRead 
} from '@/hooks/useQuranTracking';
import { BookOpen, Plus, Trash2, ChevronRight, History, Target, Calendar, BookMarked, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TadarusViewProps {
  onOpenQuran?: () => void;
}

const TadarusView = ({ onOpenQuran }: TadarusViewProps) => {
  const { user } = useAuthContext();
  const { data: surahs } = useQuranSurahs();
  const { data: todayLogs, isLoading: logsLoading } = useTodayQuranLogs(user?.id);
  const stats = useQuranStats(user?.id);
  const deleteLog = useDeleteQuranLog();
  const { data: lastRead } = useQuranLastRead(user?.id);

  const targetJuz = 30;
  const progressPercentage = Math.min((stats.estimatedJuz / targetJuz) * 100, 100);
  const today = format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId });

  const handleAddClick = () => {
    if (onOpenQuran) {
      onOpenQuran();
    } else {
      const quranMenu = document.querySelector('[data-menu="quran"]') as HTMLElement;
      if (quranMenu) quranMenu.click();
    }
  };

  const handleDelete = (logId: string) => {
    if (!user) return;
    deleteLog.mutate({ logId, userId: user.id });
  };

  const getSurahName = (surahNumber: number) => {
    const surah = surahs?.find(s => s.number === surahNumber);
    return surah?.name || `Surah ${surahNumber}`;
  };

  const getSurahArabic = (surahNumber: number) => {
    const surah = surahs?.find(s => s.number === surahNumber);
    return surah?.name_arabic || '';
  };

  if (!user) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary/50" />
          </div>
          <p className="text-muted-foreground font-medium">Silakan login untuk melacak tadarus Anda</p>
          <p className="text-xs text-muted-foreground mt-1">Catatan bacaan akan tersimpan ke akun Anda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Date */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Tadarus Al-Qur'an</h2>
          <p className="text-xs text-muted-foreground">{today}</p>
        </div>
        <Button 
          size="sm" 
          className="rounded-full bg-primary hover:bg-primary/90 shadow-md"
          onClick={handleAddClick}
        >
          <Plus className="w-4 h-4 mr-1" />
          Baca Quran
        </Button>
      </div>

      {/* Progress Khatam Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden">
        <CardContent className="p-5 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5" />
              <span className="text-sm font-semibold opacity-90">Progress Khatam</span>
            </div>
            
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-4xl font-bold">{stats.estimatedJuz.toFixed(1)}</span>
                <span className="text-lg opacity-80">/30</span>
                <span className="text-sm ml-1 opacity-80">Juz</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.totalVerses}</p>
                <p className="text-xs opacity-80">Total Ayat</p>
              </div>
            </div>
            
            <div className="relative h-3 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] opacity-70">0%</span>
              <span className="text-[10px] opacity-70 font-semibold">{progressPercentage.toFixed(0)}% Khatam</span>
              <span className="text-[10px] opacity-70">100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none bg-emerald-50 dark:bg-emerald-950/30 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-1">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.totalVerses}</p>
            <p className="text-[10px] text-emerald-600/70 font-medium">Total Ayat</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-amber-50 dark:bg-amber-950/30 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto mb-1">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.daysRead}</p>
            <p className="text-[10px] text-amber-600/70 font-medium">Hari Tadarus</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-blue-50 dark:bg-blue-950/30 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-1">
              <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.uniqueSurahs}</p>
            <p className="text-[10px] text-blue-600/70 font-medium">Surat Dibaca</p>
          </CardContent>
        </Card>
      </div>

      {/* Last Read Card - Direct Link to Quran */}
      {lastRead && 'surah_number' in lastRead && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-primary/20 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                      Terakhir Baca
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {getSurahName((lastRead as any).surah_number)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Ayat {(lastRead as any).ayah_number}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-xs text-muted-foreground">
                        Juz {(lastRead as any).juz_number}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-full bg-primary hover:bg-primary/90 shadow-md px-4"
                  onClick={handleAddClick}
                >
                  Lanjut
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today's Reading Section */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-muted/50 bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Bacaan Hari Ini</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  {todayLogs?.length || 0} sesi tercatat
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Memuat bacaan...</p>
            </div>
          ) : todayLogs && todayLogs.length > 0 ? (
            <div className="divide-y divide-muted/30">
              {todayLogs.map((log, index) => {
                const surah = log.quran_surahs;
                return (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{log.surah_start}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">
                            {surah?.name || getSurahName(log.surah_start)}
                          </p>
                          {surah?.name_arabic && (
                            <span className="text-xs text-muted-foreground font-arabic">
                              {surah.name_arabic}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            Ayat {log.ayah_start} - {log.ayah_end}
                          </span>
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-medium border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-800">
                            {log.total_verses} ayat
                          </Badge>
                        </div>
                        {log.juz_end && (
                          <span className="text-[10px] text-primary/70 font-medium">Juz {log.juz_end}</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
              
              {/* CTA to continue reading */}
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
                <Button 
                  variant="outline" 
                  className="w-full border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handleAddClick}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Lanjut Baca Al-Quran
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-muted-foreground opacity-30" />
              </div>
              <p className="text-base font-bold text-foreground">Belum ada bacaan hari ini</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
                Mulai tadarus untuk mencatat progres harian dan menuju khatam Al-Qur'an
              </p>
              <Button 
                className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-md"
                onClick={handleAddClick}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Buka Al-Quran
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-none bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Tips Istiqomah</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Baca minimal 1 halaman Al-Qur'an setiap hari. Klik tombol centang di setiap ayat untuk mencatat progres otomatis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TadarusView;
