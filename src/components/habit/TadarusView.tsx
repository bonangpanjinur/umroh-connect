import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuranSurahs, useTodayQuranLogs, useQuranStats, useDeleteQuranLog } from '@/hooks/useQuranTracking';
import { BookOpen, Plus, Trash2, Calendar, CheckCircle2, ChevronRight, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const TadarusView = () => {
  const { user } = useAuthContext();
  const { data: surahs } = useQuranSurahs();
  const { data: todayLogs, isLoading: logsLoading } = useTodayQuranLogs(user?.id);
  const stats = useQuranStats(user?.id);
  const deleteLog = useDeleteQuranLog();
  const [lastRead, setLastRead] = useState<any>(null);

  // Ambil data terakhir baca dari database
  useEffect(() => {
    const fetchLastRead = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('quran_last_read')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) setLastRead(data);
    };
    fetchLastRead();
  }, [user]);

  const targetJuz = 30;
  const progressPercentage = Math.min((stats.estimatedJuz / targetJuz) * 100, 100);

  const handleAddClick = () => {
    // Navigasi ke Al-Quran
    // Di aplikasi nyata, ini akan menggunakan router.push atau window.location
    // Untuk demo ini, kita asumsikan ada route /quran
    if (lastRead) {
      window.location.href = `/quran?surah=${lastRead.surah_number}&ayah=${lastRead.ayah_number}`;
    } else {
      window.location.href = '/quran';
    }
  };

  const handleDelete = (logId: string) => {
    if (!user) return;
    deleteLog.mutate({ logId, userId: user.id });
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground font-medium">Silakan login untuk melacak tadarus Anda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Modern Look */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-none bg-emerald-50 dark:bg-emerald-950/20 shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 leading-none mb-1">
                  {stats.totalVerses}
                </p>
                <p className="text-xs font-medium text-emerald-600/70 uppercase tracking-wider">Total Ayat</p>
                <p className="text-[10px] text-emerald-600/50 mt-1 italic">~{stats.estimatedJuz} juz dibaca</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-none bg-amber-50 dark:bg-amber-950/20 shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 leading-none mb-1">
                  {stats.daysRead}
                </p>
                <p className="text-xs font-medium text-amber-600/70 uppercase tracking-wider">Hari Tadarus</p>
                <p className="text-[10px] text-amber-600/50 mt-1 italic">{stats.uniqueSurahs} surat berbeda</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress to Khatam - Enhanced Visual */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Progress Khatam
                {progressPercentage >= 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Target: 30 Juz Al-Quran</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-primary">{stats.estimatedJuz}</span>
              <span className="text-sm text-muted-foreground font-medium">/30 Juz</span>
            </div>
          </div>
          <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2">
             <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Mulai</span>
             <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Khatam</span>
          </div>
        </CardContent>
      </Card>

      {/* Today's Reading Section - Clean & Connect to Quran */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-2 border-b border-muted/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wide">Bacaan Hari Ini</CardTitle>
            </div>
            <Button 
              size="sm" 
              className="rounded-full h-8 px-4 bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95"
              onClick={handleAddClick}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
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
                const surah = surahs?.find(s => s.number === log.surah_number);
                return (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {log.surah_number}
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {surah?.name} <span className="text-xs font-normal text-muted-foreground ml-1">{surah?.name_arabic}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Ayat {log.start_verse} - {log.end_verse}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-medium border-emerald-200 text-emerald-600 bg-emerald-50">
                            {log.end_verse - log.start_verse + 1} ayat
                          </Badge>
                        </div>
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
              <div className="p-4 bg-muted/10 text-center">
                 <button onClick={handleAddClick} className="text-xs text-primary font-bold flex items-center justify-center gap-1 mx-auto hover:underline">
                    Lanjut Baca Al-Quran <ChevronRight className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground opacity-40" />
              </div>
              <p className="text-sm font-bold text-foreground">Belum ada bacaan hari ini</p>
              <p className="text-xs text-muted-foreground mt-1 mb-5">Klik tombol tambah untuk mulai mencatat progres tadarus harian Anda.</p>
              <Button variant="outline" size="sm" className="rounded-full px-6" onClick={handleAddClick}>
                Buka Al-Quran
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TadarusView;
