import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useKhatamTarget } from '@/hooks/useKhatamTarget';
import { useQuranStats } from '@/hooks/useQuranTracking';
import { useAuthContext } from '@/contexts/AuthContext';
import { Target, Calendar, TrendingUp, TrendingDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const KhatamCalculator = () => {
  const { user } = useAuthContext();
  const { target, setTarget, removeTarget, getStatus, isLoading } = useKhatamTarget();
  const stats = useQuranStats(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [targetDate, setTargetDate] = useState(
    format(addDays(new Date(), 30), 'yyyy-MM-dd')
  );

  const status = target ? getStatus(stats.totalVerses) : null;

  const handleSetTarget = () => {
    setTarget.mutate({ targetDate, currentAyat: stats.totalVerses });
    setShowForm(false);
  };

  if (isLoading) return null;

  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Kalkulator Khatam</p>
              <p className="text-[10px] text-muted-foreground">Target & estimasi khatam Anda</p>
            </div>
          </div>
          {target && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] text-muted-foreground"
              onClick={() => removeTarget.mutate()}
            >
              <X className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {target && status ? (
            <motion.div
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Target info */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Target: {format(new Date(target.target_date), 'd MMM yyyy', { locale: localeId })}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] ${status.isOnTrack 
                    ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' 
                    : 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/50'}`}
                >
                  {status.isOnTrack ? (
                    <><TrendingUp className="w-3 h-3 mr-1" />On Track</>
                  ) : (
                    <><TrendingDown className="w-3 h-3 mr-1" />Kejar Target</>
                  )}
                </Badge>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">{status.progressPercent.toFixed(1)}% selesai</span>
                  <span className="font-medium text-violet-600">{status.daysLeft} hari tersisa</span>
                </div>
                <div className="relative">
                  <Progress value={status.progressPercent} className="h-2.5" />
                  {/* Expected progress marker */}
                  <div 
                    className="absolute top-0 h-2.5 w-0.5 bg-violet-400/60"
                    style={{ left: `${Math.min(status.expectedProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Daily target */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/60 dark:bg-white/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{target.pages_per_day}</p>
                  <p className="text-[10px] text-muted-foreground">halaman/hari</p>
                </div>
                <div className="bg-white/60 dark:bg-white/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{target.ayat_per_day}</p>
                  <p className="text-[10px] text-muted-foreground">ayat/hari</p>
                </div>
              </div>
            </motion.div>
          ) : showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Tanggal Target Khatam</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 h-8 text-xs"
                  onClick={handleSetTarget}
                  disabled={setTarget.isPending}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Set Target
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button 
                variant="outline" 
                className="w-full border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50"
                onClick={() => setShowForm(true)}
              >
                <Target className="w-4 h-4 mr-2" />
                Set Target Khatam
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default KhatamCalculator;
