import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { TabId } from '@/types';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import HomeView from '@/components/home/HomeView';
import ChecklistView from '@/components/checklist/ChecklistView';
import PaketView from '@/components/paket/PaketView';
import AkunView from '@/components/akun/AkunView';
import HajiView from '@/components/haji/HajiView';
import SOSModal from '@/components/modals/SOSModal';
import TasbihModal from '@/components/modals/TasbihModal';
import QiblaModal from '@/components/modals/QiblaModal';
import ManasikView from '@/components/manasik/ManasikView';
import MapsView from '@/components/maps/MapsView';
import ReminderView from '@/components/reminder/ReminderView';
import JournalView from '@/components/journal/JournalView';
import DoaView from '@/components/doa/DoaView';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import OfflineManagerView from '@/components/offline/OfflineManagerView';
import PackingListGenerator from '@/components/packing/PackingListGenerator';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || 'home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [showManasik, setShowManasik] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showDoa, setShowDoa] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showPacking, setShowPacking] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const handlePackageClick = (packageId: string) => {
    setSelectedPackageId(packageId);
    setActiveTab('paket');
    setSearchParams({ tab: 'paket', package: packageId });
  };

  // Sync URL param with active tab
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== 'home') {
      setSearchParams({ tab });
    } else {
      setSearchParams({});
    }
  };

  const handleMenuClick = (menuId: string) => {
    switch (menuId) {
      case 'tasbih':
        setIsTasbihOpen(true);
        break;
      case 'qibla':
        setIsQiblaOpen(true);
        break;
      case 'doa':
        setShowManasik(true);
        break;
      case 'peta':
        setShowMaps(true);
        break;
      case 'reminder':
        setShowReminder(true);
        break;
      case 'journal':
        setShowJournal(true);
        break;
      case 'doaharian':
        setShowDoa(true);
        break;
      case 'notifikasi':
        setShowNotifications(true);
        break;
      case 'offline':
        setShowOffline(true);
        break;
      case 'packing':
        setShowPacking(true);
        break;
      default:
        break;
    }
  };

  const renderView = () => {
    // Show Packing List Generator
    if (showPacking) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowPacking(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              ←
            </button>
            <h2 className="font-bold text-lg">Packing List Generator</h2>
          </div>
          <div className="p-4">
            <PackingListGenerator onBack={() => setShowPacking(false)} />
          </div>
        </div>
      );
    }

    // Show Offline Manager
    if (showOffline) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowOffline(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              ←
            </button>
            <h2 className="font-bold text-lg">Offline Manager</h2>
          </div>
          <div className="p-4">
            <OfflineManagerView />
          </div>
        </div>
      );
    }

    // Show Notification Center
    if (showNotifications) {
      return <NotificationCenter onBack={() => setShowNotifications(false)} />;
    }

    // Show Doa view
    if (showDoa) {
      return <DoaView onBack={() => setShowDoa(false)} />;
    }

    // Show Journal view
    if (showJournal) {
      return <JournalView onBack={() => setShowJournal(false)} />;
    }

    // Show Reminder view
    if (showReminder) {
      return <ReminderView onBack={() => setShowReminder(false)} />;
    }

    // Show Maps view when peta menu is clicked
    if (showMaps) {
      return <MapsView onBack={() => setShowMaps(false)} />;
    }

    // Show Manasik view when doa menu is clicked
    if (showManasik) {
      return <ManasikView onBack={() => setShowManasik(false)} />;
    }

    switch (activeTab) {
      case 'home':
        return <HomeView onMenuClick={handleMenuClick} onPackageClick={handlePackageClick} />;
      case 'checklist':
        return <ChecklistView />;
      case 'paket':
        return <PaketView initialPackageId={selectedPackageId} />;
      case 'haji':
        return <HajiView />;
      case 'akun':
        return <AkunView />;
      default:
        return <HomeView onMenuClick={handleMenuClick} onPackageClick={handlePackageClick} />;
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
        
        {!showManasik && !showMaps && !showReminder && !showJournal && !showDoa && !showNotifications && !showPacking && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
        
        {/* Modals */}
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaModal isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
      </div>
    </div>
  );
};

export default Index;
