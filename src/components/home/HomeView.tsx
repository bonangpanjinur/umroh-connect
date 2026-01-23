import PrayerTimeCard from './PrayerTimeCard';
import PromoBanner from './PromoBanner';
import QuickMenu from './QuickMenu';
import JourneyTimeline from './JourneyTimeline';
import { FeaturedPackages } from './FeaturedPackages';
import DepartureCountdown from '../countdown/DepartureCountdown';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';

interface HomeViewProps {
  onMenuClick?: (menuId: string) => void;
  onPackageClick?: (packageId: string) => void;
}

const HomeView = ({ onMenuClick, onPackageClick }: HomeViewProps) => {
  const { user } = useAuthContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20 space-y-6"
    >
      <PrayerTimeCard />
      
      {/* Countdown Timer - only show for logged in users */}
      {user && (
        <div className="px-4">
          <DepartureCountdown 
            onNotificationClick={() => onMenuClick?.('notifikasi')} 
          />
        </div>
      )}
      
      <PromoBanner />
      <FeaturedPackages onPackageClick={onPackageClick} />
      <QuickMenu onMenuClick={onMenuClick} />
      <JourneyTimeline />
    </motion.div>
  );
};

export default HomeView;
