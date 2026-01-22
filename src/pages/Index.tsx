import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TabId } from '@/types';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import HomeView from '@/components/home/HomeView';
import ChecklistView from '@/components/checklist/ChecklistView';
import PaketView from '@/components/paket/PaketView';
import AkunView from '@/components/akun/AkunView';
import SOSModal from '@/components/modals/SOSModal';
import TasbihModal from '@/components/modals/TasbihModal';
import QiblaModal from '@/components/modals/QiblaModal';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);

  const handleMenuClick = (menuId: string) => {
    switch (menuId) {
      case 'tasbih':
        setIsTasbihOpen(true);
        break;
      case 'qibla':
        setIsQiblaOpen(true);
        break;
      default:
        break;
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onMenuClick={handleMenuClick} />;
      case 'checklist':
        return <ChecklistView />;
      case 'paket':
        return <PaketView />;
      case 'akun':
        return <AkunView />;
      default:
        return <HomeView onMenuClick={handleMenuClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex justify-center">
      {/* App Container - Mobile viewport simulation */}
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-float">
        <AppHeader onSOSClick={() => setIsSOSOpen(true)} />
        
        <main className="animate-fade-in">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>
        
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Modals */}
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaModal isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
      </div>
    </div>
  );
};

export default Index;
