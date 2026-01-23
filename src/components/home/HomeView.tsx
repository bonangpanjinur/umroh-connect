import PrayerTimeCard from './PrayerTimeCard';
import PromoBanner from './PromoBanner';
import QuickMenu from './QuickMenu';
import JourneyTimeline from './JourneyTimeline';
import { FeaturedPackages } from './FeaturedPackages';
import { motion } from 'framer-motion';

interface HomeViewProps {
  onMenuClick?: (menuId: string) => void;
  onPackageClick?: (packageId: string) => void;
}

const HomeView = ({ onMenuClick, onPackageClick }: HomeViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20 space-y-6"
    >
      <PrayerTimeCard />
      <PromoBanner />
      <FeaturedPackages onPackageClick={onPackageClick} />
      <QuickMenu onMenuClick={onMenuClick} />
      <JourneyTimeline />
    </motion.div>
  );
};

export default HomeView;
