import { useState } from 'react';
import PrayerTimeCard from './PrayerTimeCard';
import PromoBanner from './PromoBanner';
import QuickMenu from './QuickMenu';
import JourneyTimeline from './JourneyTimeline';
import { FeaturedPackages } from './FeaturedPackages';
import DepartureCountdown from '../countdown/DepartureCountdown';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { useJamaahAccess } from '@/hooks/useJamaahAccess';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeViewProps {
  onMenuClick?: (menuId: string) => void;
  onPackageClick?: (packageId: string) => void;
}

const HomeView = ({ onMenuClick, onPackageClick }: HomeViewProps) => {
  const { user } = useAuthContext();
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
