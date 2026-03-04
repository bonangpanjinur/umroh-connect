import { useState } from 'react';
import { useLearningReminder } from '@/hooks/useLearningReminder';
import PrayerTimeCard from './PrayerTimeCard';
import PromoBanner from './PromoBanner';
import QuickMenu from './QuickMenu';
import JourneyTimeline from './JourneyTimeline';
import { FeaturedPackages } from './FeaturedPackages';
import UmrahQuickCard from './UmrahQuickCard';
import DepartureCountdown from '../countdown/DepartureCountdown';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRamadhanMode } from '@/contexts/RamadhanModeContext';
import { useJamaahAccess } from '@/hooks/useJamaahAccess';
import { getRamadanDay, getDaysUntilIdulFitri } from '@/hooks/useRamadhanDashboard';
import { ChevronDown, ChevronUp, MapPin, Moon, Star, BookOpen, HandHeart, Book, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HomeViewProps {
  onMenuClick?: (menuId: string) => void;
  onPackageClick?: (packageId: string) => void;
  onNavigateBelajar?: () => void;
}

const HomeView = ({ onMenuClick, onPackageClick, onNavigateBelajar }: HomeViewProps) => {
  const { user } = useAuthContext();
  const { isRamadhanMode } = useRamadhanMode();
  const { hasActiveBooking } = useJamaahAccess();
  const [showTimeline, setShowTimeline] = useState(() => {
    try {
      const saved = localStorage.getItem('show_journey_timeline');
      return saved !== null ? saved === 'true' : true;
    } catch { return true; }
  });

  // Trigger daily learning reminder
  useLearningReminder();

  const toggleTimeline = () => {
    const next = !showTimeline;
    setShowTimeline(next);
    localStorage.setItem('show_journey_timeline', String(next));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20 space-y-6"
    >
      <PrayerTimeCard />

      {/* Ramadan Banner */}
      {isRamadhanMode && (
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-amber-300 dark:border-amber-800 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-amber-800 dark:text-amber-200">
                        🌙 Ramadhan Hari ke-{getRamadanDay()}
                      </h3>
                      <p className="text-[10px] text-amber-700/70 dark:text-amber-300/70">
                        {getDaysUntilIdulFitri()} hari menuju Idul Fitri
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {getRamadanDay() >= 21 && (
                      <Badge className="bg-amber-500 text-white text-[9px] animate-pulse">
                        <Star className="w-2.5 h-2.5 mr-0.5" />
                        Lailatul Qadar
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Quick Ramadan actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                    onClick={() => onMenuClick?.('ibadah')}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Dashboard Ramadhan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                    onClick={() => onMenuClick?.('quran')}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Tadarus
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
      
      {/* Countdown Timer - only show for users with active booking */}
      {user && hasActiveBooking && (
        <div className="px-4">
          <DepartureCountdown 
            onNotificationClick={() => onMenuClick?.('notifikasi')} 
          />
        </div>
      )}
      {/* Umrah Quick Card - CTA untuk belajar */}
      <UmrahQuickCard 
        onNavigateBelajar={() => onNavigateBelajar?.()}
        onMenuClick={onMenuClick}
      />

      {/* Quick Access - 4 tombol utama ibadah */}
      <div className="px-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'manasik', label: 'Manasik', icon: BookOpen, gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/25' },
            { id: 'doaharian', label: 'Doa', icon: HandHeart, gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/25' },
            { id: 'quran', label: 'Al-Quran', icon: Book, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25' },
            { id: 'qibla', label: 'Kiblat', icon: Compass, gradient: 'from-sky-500 to-sky-600', shadow: 'shadow-sky-500/25' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => onMenuClick?.(action.id)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} ${action.shadow} shadow-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-foreground">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <QuickMenu onMenuClick={onMenuClick} />
      <FeaturedPackages onPackageClick={onPackageClick} />
      <PromoBanner />

      {/* Journey Timeline - only for users with active booking */}
      {user && hasActiveBooking && (
        <>
          {showTimeline ? (
            <div className="space-y-2">
              <div className="px-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 gap-1"
                  onClick={toggleTimeline}
                >
                  <ChevronUp className="w-3 h-3" />
                  Sembunyikan Timeline
                </Button>
              </div>
              <JourneyTimeline />
            </div>
          ) : (
            <div className="px-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs h-9 border-dashed"
                onClick={toggleTimeline}
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Lihat Timeline Perjalanan
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default HomeView;
