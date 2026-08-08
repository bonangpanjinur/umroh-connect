import { motion } from 'framer-motion';
import { BookOpen, Fingerprint, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIbadahStats } from '@/hooks/useIbadahHabits';
import { useQuranLastRead } from '@/hooks/useQuranTracking';
import { usePrayerCheckIn } from '@/hooks/usePrayerCheckIn';

interface TodayIbadahCardProps {
  onMenuClick?: (menuId: string) => void;
}

const TodayIbadahCard = ({ onMenuClick }: TodayIbadahCardProps) => {
  const { user } = useAuthContext();
  const { data: stats } = useIbadahStats(user?.id);
  const { data: lastRead } = useQuranLastRead(user?.id);
  const { completedCount, total } = usePrayerCheckIn();

  const last = lastRead as { surah_number?: number; ayah_number?: number } | null;

  const rows = [
    {
      id: 'ibadah',
      icon: Flame,
      label: 'Tracker ibadah',
      value: stats
        ? `${stats.completedToday}/${stats.totalHabits} selesai hari ini`
        : 'Mulai catat ibadah harian',
    },
    {
      id: 'quran',
      icon: BookOpen,
      label: 'Tilawah',
      value: last?.surah_number
        ? `Terakhir: Surah ${last.surah_number} ayat ${last.ayah_number}`
        : 'Belum ada bacaan tersimpan',
    },
    {
      id: 'tasbih',
      icon: Fingerprint,
      label: 'Dzikir & tasbih',
      value: 'Lanjutkan hitungan dzikir',
    },
  ];

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                Ibadah Hari Ini
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Sholat {completedCount}/{total}
              </span>
            </div>

            <div className="space-y-1.5">
              {rows.map((row) => (
                <button
                  key={row.id}
                  onClick={() => onMenuClick?.(row.id)}
                  className="w-full min-h-11 flex items-center gap-3 rounded-xl bg-muted/40 hover:bg-muted px-3 py-2 text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <row.icon className="w-4 h-4 text-primary" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold">{row.label}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{row.value}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TodayIbadahCard;
