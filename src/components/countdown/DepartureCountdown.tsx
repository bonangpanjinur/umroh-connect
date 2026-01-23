import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Calendar, Clock, Bell, ChevronRight,
  MapPin, Star, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useUserBookings } from '@/hooks/useBookings';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface DepartureCountdownProps {
  onNotificationClick?: () => void;
  compact?: boolean;
}

const DepartureCountdown = ({ onNotificationClick, compact = false }: DepartureCountdownProps) => {
  const { data: bookings, isLoading } = useUserBookings();
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);

  // Find the nearest upcoming departure
  const nextDeparture = useMemo(() => {
    if (!bookings || bookings.length === 0) return null;

    const now = new Date();
    const upcomingBookings = bookings
      .filter(booking => {
        if (!booking.departure?.departure_date) return false;
        const depDate = new Date(booking.departure.departure_date);
        return depDate > now && ['confirmed', 'paid'].includes(booking.status);
      })
      .sort((a, b) => {
        const dateA = new Date(a.departure!.departure_date);
        const dateB = new Date(b.departure!.departure_date);
        return dateA.getTime() - dateB.getTime();
      });

    return upcomingBookings[0] || null;
  }, [bookings]);

  // Calculate countdown
  useEffect(() => {
    if (!nextDeparture?.departure?.departure_date) {
      setCountdown(null);
      return;
    }

    const departureDate = new Date(nextDeparture.departure.departure_date);
    departureDate.setHours(0, 0, 0, 0);

    const calculateCountdown = () => {
      const now = new Date();
      const total = departureDate.getTime() - now.getTime();

      if (total <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const days = differenceInDays(departureDate, now);
      const hours = differenceInHours(departureDate, now) % 24;
      const minutes = differenceInMinutes(departureDate, now) % 60;
      const seconds = differenceInSeconds(departureDate, now) % 60;

      setCountdown({ days, hours, minutes, seconds, total });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextDeparture]);

  // Get phase and styling based on days remaining
  const getPhaseInfo = (days: number) => {
    if (days <= 0) return { 
      phase: 'H-0', 
      label: 'Hari Keberangkatan!', 
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      textColor: 'text-emerald-600',
      urgent: true 
    };
    if (days === 1) return { 
      phase: 'H-1', 
      label: 'Besok Berangkat!', 
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      textColor: 'text-amber-600',
      urgent: true 
    };
    if (days <= 3) return { 
      phase: 'H-3', 
      label: 'Persiapan Akhir', 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      textColor: 'text-orange-600',
      urgent: true 
    };
    if (days <= 7) return { 
      phase: 'H-7', 
      label: 'Minggu Terakhir', 
      color: 'from-primary to-primary/80',
      bgColor: 'bg-primary/5',
      textColor: 'text-primary',
      urgent: false 
    };
    if (days <= 14) return { 
      phase: 'H-14', 
      label: '2 Minggu Lagi', 
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      textColor: 'text-blue-600',
      urgent: false 
    };
    if (days <= 30) return { 
      phase: 'H-30', 
      label: 'Persiapan Awal', 
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-900',
      textColor: 'text-slate-600',
      urgent: false 
    };
    return { 
      phase: `H-${days}`, 
      label: 'Menuju Keberangkatan', 
      color: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-50 dark:bg-slate-900',
      textColor: 'text-slate-500',
      urgent: false 
    };
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-24 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!nextDeparture || !countdown) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <Plane className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Belum ada keberangkatan terjadwal
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pesan paket umroh untuk melihat countdown
          </p>
        </CardContent>
      </Card>
    );
  }

  const phaseInfo = getPhaseInfo(countdown.days);
  const departureDate = new Date(nextDeparture.departure!.departure_date);

  // Compact version for sidebar/header
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-3 rounded-xl ${phaseInfo.bgColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${phaseInfo.color}`}>
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium">{phaseInfo.label}</p>
              <p className={`text-lg font-bold ${phaseInfo.textColor}`}>
                {countdown.days} Hari
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {phaseInfo.phase}
          </Badge>
        </div>
      </motion.div>
    );
  }

  // Full countdown card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`overflow-hidden border-0 shadow-lg ${phaseInfo.urgent ? 'ring-2 ring-primary/20' : ''}`}>
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${phaseInfo.color} p-4 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Plane className="w-5 h-5" />
              </motion.div>
              <span className="font-medium text-sm">Countdown Keberangkatan</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {phaseInfo.phase}
            </Badge>
          </div>

          {/* Countdown Timer */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <CountdownUnit value={countdown.days} label="Hari" />
            <CountdownUnit value={countdown.hours} label="Jam" />
            <CountdownUnit value={countdown.minutes} label="Menit" />
            <CountdownUnit value={countdown.seconds} label="Detik" animate />
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Package Info */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${phaseInfo.bgColor}`}>
              <MapPin className={`w-4 h-4 ${phaseInfo.textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {nextDeparture.package?.name || 'Paket Umroh'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {nextDeparture.travel?.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(departureDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </span>
              </div>
            </div>
          </div>

          {/* Phase Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{phaseInfo.label}</span>
              <span className={`font-medium ${phaseInfo.textColor}`}>
                {countdown.days <= 30 ? `${Math.round((1 - countdown.days / 30) * 100)}%` : 'Awal'}
              </span>
            </div>
            <Progress 
              value={countdown.days <= 30 ? Math.round((1 - countdown.days / 30) * 100) : 5} 
              className="h-2"
            />
          </div>

          {/* Milestone Badges */}
          <div className="flex flex-wrap gap-2">
            <MilestoneBadge days={30} currentDays={countdown.days} label="H-30" />
            <MilestoneBadge days={14} currentDays={countdown.days} label="H-14" />
            <MilestoneBadge days={7} currentDays={countdown.days} label="H-7" />
            <MilestoneBadge days={3} currentDays={countdown.days} label="H-3" />
            <MilestoneBadge days={1} currentDays={countdown.days} label="H-1" />
            <MilestoneBadge days={0} currentDays={countdown.days} label="H-0" />
          </div>

          {/* Notification CTA */}
          {onNotificationClick && (
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={onNotificationClick}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Pengaturan Pengingat</span>
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {/* Urgent Alert */}
          <AnimatePresence>
            {phaseInfo.urgent && countdown.days <= 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-lg ${phaseInfo.bgColor} flex items-start gap-2`}
              >
                <AlertCircle className={`w-4 h-4 ${phaseInfo.textColor} mt-0.5`} />
                <div>
                  <p className={`text-xs font-medium ${phaseInfo.textColor}`}>
                    {countdown.days === 0 
                      ? 'Hari ini adalah hari keberangkatan Anda!'
                      : countdown.days === 1
                        ? 'Besok adalah hari keberangkatan. Pastikan semua sudah siap!'
                        : 'Tinggal beberapa hari lagi. Cek kembali checklist persiapan Anda.'
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Countdown unit component
const CountdownUnit = ({ 
  value, 
  label, 
  animate = false 
}: { 
  value: number; 
  label: string; 
  animate?: boolean;
}) => (
  <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
    <motion.div
      key={animate ? value : undefined}
      initial={animate ? { scale: 1.2, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      className="text-2xl font-bold"
    >
      {String(value).padStart(2, '0')}
    </motion.div>
    <div className="text-xs opacity-80">{label}</div>
  </div>
);

// Milestone badge component
const MilestoneBadge = ({ 
  days, 
  currentDays, 
  label 
}: { 
  days: number; 
  currentDays: number; 
  label: string;
}) => {
  const isPassed = currentDays <= days;
  const isCurrent = currentDays === days || (currentDays < days && currentDays > (days === 30 ? 14 : days === 14 ? 7 : days === 7 ? 3 : days === 3 ? 1 : days === 1 ? 0 : -1));
  
  return (
    <Badge 
      variant={isPassed ? "default" : "outline"} 
      className={`text-xs ${isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''} ${isPassed ? '' : 'opacity-50'}`}
    >
      {isPassed && <Star className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
};

export default DepartureCountdown;
