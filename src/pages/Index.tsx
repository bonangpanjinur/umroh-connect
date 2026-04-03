import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { TabId } from '@/types';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import HomeView from '@/components/home/HomeView';
import PaketView from '@/components/paket/PaketView';
import AkunView from '@/components/akun/AkunView';
import UmrahLearningHub from '@/components/learning/UmrahLearningHub';
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
import CurrencyConverter from '@/components/currency/CurrencyConverter';
import PublicReviewsView from '@/components/reviews/PublicReviewsView';
import QuranView from '@/components/quran/QuranView';
import IbadahHubView from '@/components/habit/IbadahHubView';
import CalculatorHub from '@/components/calculator/CalculatorHub';
import ShopView from '@/components/shop/ShopView';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { ArrowLeft } from 'lucide-react';

// Views that render as full sub-pages (hide bottom nav)
const FULLSCREEN_VIEWS = ['shop', 'quran', 'ibadah', 'savings', 'reviews', 'manasik', 'maps', 'reminder', 'journal', 'doa', 'notifications', 'offline'] as const;
type FullscreenView = typeof FULLSCREEN_VIEWS[number];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tabFromUrl = searchParams.get('tab') as TabId | null;
  const viewFromUrl = searchParams.get('view') as FullscreenView | null;
  
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || 'home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const activeView = viewFromUrl;

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

  const openView = useCallback((view: string, params?: Record<string, string>) => {
    setSearchParams({ view, ...params });
  }, [setSearchParams]);

  const closeView = useCallback(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab) {
      setSearchParams({ tab: currentTab });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams, searchParams]);

  const handleMenuClick = (menuId: string) => {
    // Support deep links like "manasik:3" to go to step 3
    if (menuId.startsWith('manasik:')) {
      const step = menuId.split(':')[1];
      openView('manasik', { step });
      return;
    }

    // Support shop:searchTerm to open shop with pre-filled search
    if (menuId.startsWith('shop:')) {
      const searchTerm = menuId.substring(5);
      openView('shop', { search: searchTerm });
      return;
    }

    switch (menuId) {
      case 'tasbih':
        setIsTasbihOpen(true);
        break;
      case 'qibla':
        setIsQiblaOpen(true);
        break;
      case 'manasik':
        openView('manasik');
        break;
      case 'doa':
        openView('doa');  // kept for backward compat
        break;
      case 'peta':
        openView('maps');
        break;
      case 'reminder':
        openView('reminder');
        break;
      case 'journal':
        openView('journal');
        break;
      case 'doaharian':
        openView('doa');
        break;
      case 'notifikasi':
        openView('notifications');
        break;
      case 'offline':
        openView('offline');
        break;
      case 'feedback':
        setShowFeedback(true);
        break;
      case 'kurs':
        setShowCurrency(true);
        break;
      case 'reviews':
        openView('reviews');
        break;
      case 'quran':
        openView('quran');
        break;
      case 'ibadah':
        openView('ibadah');
        break;
      case 'tabungan':
        openView('savings');
        break;
      case 'shop':
        handleTabChange('shop');
        break;
      case 'checklist':
        handleTabChange('belajar');
        break;
      case 'seller':
        break;
      default:
        break;
    }
  };

  const renderView = () => {
    // Route-based sub-views
    if (activeView === 'shop') {
      return <ShopView onBack={closeView} />;
    }

    if (activeView === 'ibadah') {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button onClick={closeView} className="p-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Ibadah & Tracking</h2>
          </div>
          <IbadahHubView 
            onOpenTasbih={() => { closeView(); setIsTasbihOpen(true); }} 
            onOpenQuran={() => { setSearchParams({ view: 'quran' }); }}
          />
        </div>
      );
    }

    if (activeView === 'savings') {
      return (
        <CalculatorHub 
          onBack={closeView} 
          onViewPackages={() => { closeView(); handleTabChange('paket'); }}
        />
      );
    }

    if (activeView === 'quran') {
      return <QuranView onBack={closeView} />;
    }

    if (activeView === 'reviews') {
      return <PublicReviewsView onBack={closeView} />;
    }

    if (activeView === 'offline') {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button onClick={closeView} className="p-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Offline Manager</h2>
          </div>
          <div className="p-4"><OfflineManagerView /></div>
        </div>
      );
    }

    if (activeView === 'notifications') {
      return <NotificationCenter onBack={closeView} />;
    }

    if (activeView === 'doa') {
      return <DoaView onBack={closeView} />;
    }

    if (activeView === 'journal') {
      return <JournalView onBack={closeView} />;
    }

    if (activeView === 'reminder') {
      return <ReminderView onBack={closeView} />;
    }

    if (activeView === 'maps') {
      return <MapsView onBack={closeView} />;
    }

    if (activeView === 'manasik') {
      const stepParam = searchParams.get('step');
      const initialStep = stepParam ? parseInt(stepParam, 10) : 0;
      return <ManasikView onBack={closeView} initialStep={initialStep} />;
    }

    // Tab-based main views
    switch (activeTab) {
      case 'home':
        return <HomeView onMenuClick={handleMenuClick} onPackageClick={handlePackageClick} onNavigateBelajar={() => handleTabChange('belajar')} />;
      case 'belajar':
        return <UmrahLearningHub onMenuClick={handleMenuClick} />;
      case 'paket':
        return <PaketView initialPackageId={selectedPackageId} />;
      case 'shop':
        return <ShopView onBack={() => handleTabChange('home')} />;
      case 'akun':
        return <AkunView />;
      default:
        return <HomeView onMenuClick={handleMenuClick} onPackageClick={handlePackageClick} onNavigateBelajar={() => handleTabChange('belajar')} />;
    }
  };

  const isFullscreenView = activeView && FULLSCREEN_VIEWS.includes(activeView);

  return (
    <div className="min-h-screen bg-secondary/30 flex justify-center">
      <PWAInstallPrompt />
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-float">
        <AppHeader onSOSClick={() => setIsSOSOpen(true)} />
        <main className="animate-fade-in">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>
        
        {!isFullscreenView && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
        
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaModal isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
        <CurrencyConverter isOpen={showCurrency} onClose={() => setShowCurrency(false)} />
        <FeedbackForm isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </div>
    </div>
  );
};

export default Index;
