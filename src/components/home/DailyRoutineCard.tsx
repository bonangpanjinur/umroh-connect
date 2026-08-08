import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, BookOpen, BookHeart, Check, ChevronRight, Sunrise } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DzikirSessionModal, { isDzikirSessionDone } from '@/components/dzikir/DzikirSessionModal';
import { DzikirSessionType } from '@/data/dzikirData';

interface DailyRoutineCardProps {
  onMenuClick?: (menuId: string) => void;
}

const DailyRoutineCard = ({ onMenuClick }: DailyRoutineCardProps) => {
  const hour = new Date().getHours();
  const isEvening = hour >= 15;
  const [sessionType, setSessionType] = useState<DzikirSessionType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const steps = useMemo(() => {
    const dzikirType: DzikirSessionType = isEvening ? 'evening' : 'morning';
    const done = isDzikirSessionDone(dzikirType);
    void refreshKey;

    if (isEvening) {
      return [
        {
          id: 'dzikir',
          icon: Moon,
          label: 'Dzikir Petang',
          hint: done ? 'Sudah selesai hari ini' : 'Sekitar 5 menit',
          done,
          action: () => setSessionType('evening'),
        },
        {
          id: 'quran',
          icon: BookOpen,
          label: 'Tilawah Malam',
          hint: 'Lanjutkan dari bacaan terakhir',
          done: false,
          action: () => onMenuClick?.('quran'),
        },
        {
          id: 'journal',
          icon: BookHeart,
          label: 'Muhasabah',
          hint: 'Tulis refleksi singkat hari ini',
          done: false,
          action: () => onMenuClick?.('journal'),
        },
      ];
    }

    return [
      {
        id: 'dzikir',
        icon: Sunrise,
        label: 'Dzikir Pagi',
        hint: done ? 'Sudah selesai hari ini' : 'Sekitar 5 menit',
        done,
        action: () => setSessionType('morning'),
      },
      {
        id: 'quran',
        icon: BookOpen,
        label: 'Tilawah Pagi',
        hint: 'Lanjutkan dari bacaan terakhir',
        done: false,
        action: () => onMenuClick?.('quran'),
      },
      {
        id: 'doaharian',
        icon: BookHeart,
        label: 'Doa Harian',
        hint: 'Baca doa untuk aktivitas hari ini',
        done: false,
        action: () => onMenuClick?.('doaharian'),
      },
    ];
  }, [isEvening, onMenuClick, refreshKey]);

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                {isEvening ? (
                  <Moon className="w-4 h-4 text-primary" />
                ) : (
                  <Sun className="w-4 h-4 text-primary" />
                )}
                Rutinitas {isEvening ? 'Petang' : 'Pagi'}
              </h3>
              <Badge variant="secondary" className="text-[10px]">
                {steps.filter((s) => s.done).length}/{steps.length}
              </Badge>
            </div>

            <div className="space-y-1.5">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={step.action}
                  className="w-full min-h-11 flex items-center gap-3 rounded-xl bg-muted/40 hover:bg-muted px-3 py-2 text-left transition-colors"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.done ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {step.done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold">{step.label}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{step.hint}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {sessionType && (
        <DzikirSessionModal
          isOpen={!!sessionType}
          type={sessionType}
          onClose={() => setSessionType(null)}
          onCompleted={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
};

export default DailyRoutineCard;
