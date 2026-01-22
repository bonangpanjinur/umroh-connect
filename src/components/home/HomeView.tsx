import PrayerTimeCard from './PrayerTimeCard';
import PromoBanner from './PromoBanner';
import QuickMenu from './QuickMenu';
import JourneyTimeline from './JourneyTimeline';
import { motion } from 'framer-motion';

interface HomeViewProps {
  onMenuClick?: (menuId: string) => void;
}

const HomeView = ({ onMenuClick }: HomeViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20"
    >
      <PrayerTimeCard />
      <PromoBanner />
      <QuickMenu onMenuClick={onMenuClick} />
      <JourneyTimeline />
    </motion.div>
  );
};

export default HomeView;
