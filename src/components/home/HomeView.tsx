import { useState } from 'react';
import PrayerTimeCard from './PrayerTimeCard';
import PromoBanner from './PromoBanner';
import QuickMenu from './QuickMenu';
import JourneyTimeline from './JourneyTimeline';
import { FeaturedPackages } from './FeaturedPackages';
import DepartureCountdown from '../countdown/DepartureCountdown';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRamadhanMode } from '@/contexts/RamadhanModeContext';
import { useJamaahAccess } from '@/hooks/useJamaahAccess';
import { getRamadanDay, getDaysUntilIdulFitri } from '@/hooks/useRamadhanDashboard';
import { ChevronDown, ChevronUp, MapPin, Moon, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HomeViewProps {
  onMenuClick?: (menuId: string) => void;
  onPackageClick?: (packageId: string) => void;
}

const HomeView = ({ onMenuClick, onPackageClick }: HomeViewProps) => {
  const { user } = useAuthContext();
  const { isRamadhanMode } = useRamadhanMode();
  const { hasActiveBooking } = useJamaahAccess();
  const [showTimeline, setShowTimeline] = useState(() => {
    try {
      const saved = localStorage.getItem('show_journey_timeline');
      return saved !== null ? saved === 'true' : true;
    } catch { return true; }
  });

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
      
      <PromoBanner />
      <FeaturedPackages onPackageClick={onPackageClick} />
      <QuickMenu onMenuClick={onMenuClick} />

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
