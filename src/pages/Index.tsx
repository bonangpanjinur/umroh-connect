import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import IbadahHubView from '@/components/habit/IbadahHubView';
import SavingsCalculatorView from '@/components/savings/SavingsCalculatorView';
import ShopView from '@/components/shop/ShopView';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { FeatureLock } from '@/components/common/FeatureLock';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);

  const [showReviews, setShowReviews] = useState(false);
  const [showQuran, setShowQuran] = useState(false);
  const [showIbadahHub, setShowIbadahHub] = useState(false);
  const [showSavings, setShowSavings] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);

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
      case 'feedback':
        setShowFeedback(true);
        break;
      case 'kurs':
        setShowCurrency(true);
        break;

      case 'reviews':
        setShowReviews(true);
        break;
      case 'quran':
        setShowQuran(true);
        break;
      case 'ibadah':
        setShowIbadahHub(true);
        break;
      case 'tabungan':
        setShowSavings(true);
        break;
      case 'shop':
        setShowShop(true);
        break;
      case 'seller':
        // Seller access is now managed via admin role assignment
        break;
      default:
        break;
    }
  };

  const renderView = () => {
    // Show Shop
    if (showShop) {
      return <ShopView onBack={() => setShowShop(false)} />;
    }

    // Show Ibadah Hub (combined Ibadah, Sedekah, Olahraga, Ramadhan)
    if (showIbadahHub) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
            <button 
              onClick={() => setShowIbadahHub(false)}
              className="p-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Ibadah & Tracking</h2>
          </div>
          <IbadahHubView 
            onOpenTasbih={() => {
              setShowIbadahHub(false);
              setIsTasbihOpen(true);
            }} 
            onOpenQuran={() => {
              setShowIbadahHub(false);
              setShowQuran(true);
            }}
          />
        </div>
      );
    }

    // Show Savings Calculator
    if (showSavings) {
      return (
        <SavingsCalculatorView 
          onBack={() => setShowSavings(false)} 
          onViewPackages={() => {
            setShowSavings(false);
            handleTabChange('paket');
          }}
        />
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
        
        {!showManasik && !showMaps && !showReminder && !showJournal && !showDoa && !showNotifications && !showReviews && !showQuran && !showIbadahHub && !showSavings && !showShop && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
        
        {/* Modals */}
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaModal isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
        <CurrencyConverter isOpen={showCurrency} onClose={() => setShowCurrency(false)} />
        
        {/* Feedback Form Modal */}
        <FeedbackForm isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </div>
    </div>
  );
};

export default Index;
