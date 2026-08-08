import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { usePrayerCheckIn, PRAYER_ORDER, PrayerId } from '@/hooks/usePrayerCheckIn';
import { PrayerTimes } from '@/types';

const minutesOf = (time?: string) => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const PrayerCheckInCard = () => {
  const { times } = usePrayerTimes();
  const { completedIds, completedCount, total, togglePrayer, isLoading } = usePrayerCheckIn();

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const items = PRAYER_ORDER.map((p) => {
    const time = times ? (times as PrayerTimes)[p.id as keyof PrayerTimes] : undefined;
    const start = minutesOf(time as string | undefined);
    return {
      ...p,
      time: (time as string | undefined) ?? '--:--',
      hasEntered: start !== null ? nowMinutes >= start : false,
      done: completedIds.has(p.id as PrayerId),
    };
  });

  const missed = items.filter((i) => i.hasEntered && !i.done);
  const percent = Math.round((completedCount / total) * 100);

  return (
    <div className="px-4">
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Sholat Hari Ini</h3>
              <p className="text-[11px] text-muted-foreground">
                Tandai sholat yang sudah kamu tunaikan
              </p>
            </div>
            <Badge variant={completedCount === total ? 'default' : 'secondary'} className="text-[10px]">
              {completedCount}/{total}
            </Badge>
          </div>

          <Progress value={percent} className="h-1.5" />

          <div className="grid grid-cols-5 gap-1.5">
            {items.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.94 }}
                disabled={isLoading}
                onClick={() => togglePrayer(item.id as PrayerId, item.hasEntered && !item.done)}
                aria-pressed={item.done}
                aria-label={`Tandai sholat ${item.name}`}
                className={`min-h-11 rounded-xl border px-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
                  item.done
                    ? 'bg-primary text-primary-foreground border-primary'
                    : item.hasEntered
                      ? 'border-dashed border-primary/50 bg-primary/5 text-foreground'
                      : 'bg-muted/40 text-muted-foreground border-transparent'
                }`}
              >
                <span className="text-[10px] font-semibold leading-none">{item.name}</span>
                <span className="text-[10px] opacity-80 font-mono leading-none">{item.time}</span>
                {item.done ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3 opacity-50" />
                )}
              </motion.button>
            ))}
          </div>

          {missed.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Belum ditandai: {missed.map((m) => m.name).join(', ')}. Tandai kapan pun kamu sempat.
            </p>
          )}
          {completedCount === total && (
            <p className="text-[11px] text-primary font-medium">
              Alhamdulillah, 5 waktu lengkap hari ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrayerCheckInCard;
