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
import CurrencyConverter from '@/components/currency/CurrencyConverter';
import GroupTrackingView from '@/components/tracking/GroupTrackingView';
import PublicReviewsView from '@/components/reviews/PublicReviewsView';
import QuranView from '@/components/quran/QuranView';
import HabitView from '@/components/habit/HabitView';
import SedekahView from '@/components/habit/SedekahView';
import OlahragaView from '@/components/habit/OlahragaView';
import RamadhanDashboard from '@/components/habit/RamadhanDashboard';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { FeatureLock } from '@/components/common/FeatureLock';
import { ArrowLeft } from 'lucide-react';

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
  const [showCurrency, setShowCurrency] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showQuran, setShowQuran] = useState(false);
  const [showHabit, setShowHabit] = useState(false);
  const [showSedekah, setShowSedekah] = useState(false);
  const [showOlahraga, setShowOlahraga] = useState(false);
  const [showRamadhanDashboard, setShowRamadhanDashboard] = useState(false);
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
      case 'kurs':
        setShowCurrency(true);
        break;
      case 'tracking':
        setShowTracking(true);
        break;
      case 'reviews':
        setShowReviews(true);
        break;
      case 'quran':
        setShowQuran(true);
        break;
      case 'habit':
        setShowHabit(true);
        break;
      case 'sedekah':
        setShowSedekah(true);
        break;
      case 'olahraga':
        setShowOlahraga(true);
        break;
      case 'ramadhan':
        setShowRamadhanDashboard(true);
        break;
      default:
        break;
    }
  };

  const renderView = () => {
    // Show Ramadhan Dashboard
    if (showRamadhanDashboard) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowRamadhanDashboard(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Dashboard Ramadhan</h2>
          </div>
          <RamadhanDashboard />
        </div>
      );
    }

    // Show Olahraga View
    if (showOlahraga) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowOlahraga(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Habit Olahraga Ramadhan</h2>
          </div>
          <OlahragaView />
        </div>
      );
    }

    // Show Sedekah View
    if (showSedekah) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowSedekah(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Habit Sedekah</h2>
          </div>
          <SedekahView />
        </div>
      );
    }

    // Show Habit Ibadah
    if (showHabit) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowHabit(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Habit Ibadah</h2>
          </div>
          <HabitView />
        </div>
      );
    }
    // Show Al-Quran Reader
    if (showQuran) {
      return <QuranView onBack={() => setShowQuran(false)} />;
    }

    // Show Public Reviews
    if (showReviews) {
      return <PublicReviewsView onBack={() => setShowReviews(false)} />;
    }

    // Show Group Tracking - Premium Feature
    if (showTracking) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowTracking(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Tracking Grup</h2>
          </div>
          <div className="p-4">
            <FeatureLock 
              featureName="Tracking Grup"
              description="Pantau lokasi rombongan secara real-time. Fitur ini tersedia untuk jamaah yang sudah booking paket."
              onViewPackages={() => {
                setShowTracking(false);
                handleTabChange('paket');
              }}
            >
              <GroupTrackingView onBack={() => setShowTracking(false)} />
            </FeatureLock>
          </div>
        </div>
      );
    }

    // Show Packing List Generator - Premium Feature
    if (showPacking) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowPacking(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Packing List Generator</h2>
          </div>
          <div className="p-4">
            <FeatureLock 
              featureName="AI Packing List"
              description="Dapatkan rekomendasi packing list berdasarkan cuaca. Fitur ini tersedia untuk jamaah yang sudah booking."
              onViewPackages={() => {
                setShowPacking(false);
                handleTabChange('paket');
              }}
            >
              <PackingListGenerator onBack={() => setShowPacking(false)} />
            </FeatureLock>
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
              <ArrowLeft className="w-5 h-5" />
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
        return (
          <div className="p-4">
            <FeatureLock 
              featureName="Checklist Persiapan"
              description="Pantau progress persiapan umroh/haji Anda. Fitur ini tersedia untuk jamaah yang sudah booking."
              onViewPackages={() => handleTabChange('paket')}
            >
              <ChecklistView />
            </FeatureLock>
          </div>
        );
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
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* App Container - Mobile viewport simulation */}
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-float">
        <AppHeader onSOSClick={() => setIsSOSOpen(true)} />
        
        <main className="animate-fade-in">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>
        
        {!showManasik && !showMaps && !showReminder && !showJournal && !showDoa && !showNotifications && !showPacking && !showTracking && !showReviews && !showQuran && !showHabit && !showSedekah && !showOlahraga && !showRamadhanDashboard && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
        
        {/* Modals */}
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaModal isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
        <CurrencyConverter isOpen={showCurrency} onClose={() => setShowCurrency(false)} />
        
        {/* Feedback FAB */}
        <FeedbackButton />
      </div>
    </div>
  );
};

export default Index;
