import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Package, AlertCircle, Edit2, BarChart3, MessageSquare, Users, Sparkles, ClipboardList, TrendingUp, Zap, Crown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAgentTravel, useAgentPackages } from '@/hooks/useAgentData';
import { usePackageStats, useInterestTrend } from '@/hooks/usePackageInterests';
import { useInquiryStats } from '@/hooks/useInquiries';
import { useHajiStats } from '@/hooks/useHaji';
import { usePaymentStats } from '@/hooks/useBookings';
import { useChat } from '@/hooks/useChat';
import TravelForm from '@/components/agent/TravelForm';
import PackageForm from '@/components/agent/PackageForm';
import PackageCardAgent from '@/components/agent/PackageCardAgent';
import PackageStatsCard from '@/components/agent/PackageStatsCard';
import InterestTrendChart from '@/components/agent/InterestTrendChart';
import { InquiriesManagement } from '@/components/agent/InquiriesManagement';
import { HajiManagement } from '@/components/agent/HajiManagement';
import { FeaturedPackageManager } from '@/components/agent/FeaturedPackageManager';
import { BookingsManagement } from '@/components/agent/BookingsManagement';
import { ChatManagement } from '@/components/agent/ChatManagement';
import AnalyticsDashboard from '@/components/agent/AnalyticsDashboard';
import { AgentNotificationCenter } from '@/components/agent/AgentNotificationCenter';
import { AgentCreditsManager } from '@/components/agent/AgentCreditsManager';
import { AgentMembershipCard } from '@/components/agent/AgentMembershipCard';
import { AgentWebsiteManager } from '@/components/agent/AgentWebsiteManager';
import { AgentDashboardSidebar } from '@/components/agent/AgentDashboardSidebar';
import { Package as PackageType } from '@/types/database';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: travel, isLoading: travelLoading } = useAgentTravel();
  const { data: packages, isLoading: packagesLoading } = useAgentPackages(travel?.id);
  const { data: packageStats, isLoading: statsLoading } = usePackageStats(travel?.id);
  const { data: trendData, isLoading: trendLoading } = useInterestTrend(travel?.id, 7);
  const { data: inquiryStats } = useInquiryStats(travel?.id);
  const { data: hajiStats } = useHajiStats(travel?.id);
  const bookingStats = usePaymentStats(travel?.id);
  const { unreadCount: chatUnreadCount } = useChat(null, travel?.id || null);

  // Redirect if not logged in or not agent
  useEffect(() => {
    if (!authLoading && (!user || (profile && profile.role !== 'agent' && profile.role !== 'admin'))) {
      navigate('/');
    }
  }, [authLoading, user, profile, navigate]);

  if (authLoading || travelLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex justify-center">
        <div className="w-full bg-background min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Check if user has agent role
  if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-secondary/30 flex justify-center">
        <div className="w-full bg-background min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground mb-6">
            Anda tidak memiliki akses ke dashboard agent. Hubungi admin untuk upgrade akun Anda.
          </p>
          <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  const handleNotificationNavigate = (tab: string, referenceId?: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <AgentMembershipCard travelId={travel?.id || ''} />
            <InterestTrendChart data={trendData || []} isLoading={trendLoading} />
            <PackageStatsCard stats={packageStats || []} isLoading={statsLoading} />
          </div>
        );
      case 'analytics':
        return <AnalyticsDashboard travelId={travel?.id || ''} />;
      case 'packages':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Daftar Paket</h3>
              <Button size="sm" onClick={() => {
                setEditingPackage(null);
                setShowPackageForm(true);
              }}>
                <Plus className="w-3 h-3 mr-1" /> Tambah Paket
              </Button>
            </div>
            
            {packagesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : packages && packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <PackageCardAgent 
                    key={pkg.id} 
                    pkg={pkg} 
                    onEdit={() => {
                      setEditingPackage(pkg);
                      setShowPackageForm(true);
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">Belum ada paket umroh</p>
              </div>
            )}
          </div>
        );
      case 'bookings':
        return <BookingsManagement travelId={travel?.id || ''} />;
      case 'chat':
        return <ChatManagement travelId={travel?.id || ''} />;
      case 'haji':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Manajemen Pendaftaran Haji</h3>
            <HajiManagement travelId={travel?.id} />
          </div>
        );
      case 'inquiries':
        return <InquiriesManagement travelId={travel?.id || ''} />;
      case 'website':
        return <AgentWebsiteManager />;
      case 'featured':
        return <FeaturedPackageManager travelId={travel?.id || ''} />;
      case 'membership':
        return <AgentMembershipCard travelId={travel?.id || ''} showFull />;
      case 'credits':
        return <AgentCreditsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex justify-center">
      <div className="w-full bg-background min-h-screen flex flex-col lg:flex-row relative">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3 flex items-center justify-between lg:col-span-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Dashboard Agent</h1>
              <p className="text-xs text-muted-foreground">Kelola paket umroh Anda</p>
            </div>
          </div>
          {travel && (
            <AgentNotificationCenter 
              travelId={travel.id} 
              onNavigate={handleNotificationNavigate}
            />
          )}
        </header>

        {/* Sidebar Navigation */}
        <AgentDashboardSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatUnreadCount={chatUnreadCount}
          bookingOverdueCount={bookingStats.overduePayments}
          hajiPendingCount={hajiStats?.pending || 0}
          inquiryPendingCount={inquiryStats?.pending || 0}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {!travel ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border-2 border-dashed border-border p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Buat Travel Anda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Anda perlu membuat profil travel terlebih dahulu sebelum bisa menambahkan paket umroh.
              </p>
              <Button onClick={() => setShowTravelForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Buat Travel
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Travel Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-primary text-primary-foreground rounded-2xl p-4 shadow-primary mb-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                      {travel.logo_url ? (
                        <img src={travel.logo_url} alt={travel.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{travel.name}</h2>
                      <p className="text-xs text-primary-foreground/80">
                        {travel.verified ? '✓ Verified' : 'Belum Verified'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-0"
                    onClick={() => setShowTravelForm(true)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-primary-foreground/10 rounded-xl p-2">
                    <p className="text-2xl font-bold">{packages?.length || 0}</p>
                    <p className="text-[10px] text-primary-foreground/70">Paket</p>
                  </div>
                  <div className="bg-primary-foreground/10 rounded-xl p-2">
                    <p className="text-2xl font-bold">{travel.rating}</p>
                    <p className="text-[10px] text-primary-foreground/70">Rating</p>
                  </div>
                  <div className="bg-primary-foreground/10 rounded-xl p-2">
                    <p className="text-2xl font-bold">{travel.review_count}</p>
                    <p className="text-[10px] text-primary-foreground/70">Review</p>
                  </div>
                </div>
              </motion.div>

              {/* Content Area */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </>
          )}
        </main>

        {/* Forms Modals */}
        <AnimatePresence>
          {showTravelForm && (
            <TravelForm 
              travel={travel} 
              onClose={() => setShowTravelForm(false)} 
            />
          )}
          {showPackageForm && (
            <PackageForm 
              travelId={travel?.id}
              pkg={editingPackage} 
              onClose={() => {
                setShowPackageForm(false);
                setEditingPackage(null);
              }} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentDashboard;
