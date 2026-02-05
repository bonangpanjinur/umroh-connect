import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Package, AlertCircle, Edit2, BarChart3, MessageSquare, Users, Sparkles, ClipboardList, TrendingUp, Zap, Crown, Globe, Bell, Settings } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background flex justify-center">
        <div className="w-full bg-background min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Memuat dashboard Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has agent role
  if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background flex justify-center">
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
          <div className="space-y-6">
            <AgentMembershipCard travelId={travel?.id || ''} />
            <InterestTrendChart data={trendData || []} isLoading={trendLoading} />
            <PackageStatsCard stats={packageStats || []} isLoading={statsLoading} />
          </div>
        );
      case 'analytics':
        return <AnalyticsDashboard travelId={travel?.id || ''} />;
      case 'packages':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-2xl">Daftar Paket Umroh</h3>
                <p className="text-sm text-muted-foreground mt-1">Kelola semua paket perjalanan Anda</p>
              </div>
              <Button size="lg" onClick={() => {
                setEditingPackage(null);
                setShowPackageForm(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Paket
              </Button>
            </div>
            
            {packagesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
              </div>
            ) : packages && packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl border-2 border-dashed border-border"
              >
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold text-foreground mb-2">Belum ada paket umroh</p>
                <p className="text-sm text-muted-foreground mb-6">Mulai buat paket pertama Anda untuk menarik pelanggan</p>
                <Button onClick={() => {
                  setEditingPackage(null);
                  setShowPackageForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Buat Paket Pertama
                </Button>
              </motion.div>
            )}
          </div>
        );
      case 'bookings':
        return <BookingsManagement travelId={travel?.id || ''} />;
      case 'chat':
        return <ChatManagement travelId={travel?.id || ''} />;
      case 'haji':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-2xl">Manajemen Pendaftaran Haji</h3>
              <p className="text-sm text-muted-foreground mt-1">Kelola data pendaftaran haji pelanggan Anda</p>
            </div>
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
        return <AgentMembershipCard travelId={travel?.id || ''} />;
      case 'credits':
        return <AgentCreditsManager travelId={travel?.id || ''} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="w-full flex flex-col lg:flex-row relative">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3 flex items-center justify-between lg:col-span-full backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
              title="Kembali ke beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-xl">Dashboard Agent</h1>
              <p className="text-xs text-muted-foreground">Kelola bisnis umroh Anda dengan mudah</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {travel && (
              <AgentNotificationCenter 
                travelId={travel.id} 
                onNavigate={handleNotificationNavigate}
              />
            )}
          </div>
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
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          {!travel ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-2 border-dashed border-border rounded-2xl p-8 text-center max-w-2xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-bold text-2xl mb-3">Buat Travel Anda</h3>
              <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
                Anda perlu membuat profil travel terlebih dahulu sebelum bisa menambahkan paket umroh dan mulai menerima booking dari pelanggan.
              </p>
              <Button size="lg" onClick={() => setShowTravelForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Buat Travel Sekarang
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Travel Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground rounded-2xl p-6 shadow-lg mb-8 border border-primary/30"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center border border-primary-foreground/30">
                      {travel.logo_url ? (
                        <img src={travel.logo_url} alt={travel.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-2xl">{travel.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          travel.verified 
                            ? 'bg-green-500/20 text-green-100' 
                            : 'bg-amber-500/20 text-amber-100'
                        }`}>
                          {travel.verified ? '✓ Verified' : '⏳ Belum Verified'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-0 gap-2"
                    onClick={() => setShowTravelForm(true)}
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary-foreground/10 rounded-xl p-4 border border-primary-foreground/20 backdrop-blur-sm">
                    <p className="text-3xl font-bold">{packages?.length || 0}</p>
                    <p className="text-sm text-primary-foreground/80 mt-1">Paket Aktif</p>
                  </div>
                  <div className="bg-primary-foreground/10 rounded-xl p-4 border border-primary-foreground/20 backdrop-blur-sm">
                    <p className="text-3xl font-bold">{travel.rating?.toFixed(1) || '0'}</p>
                    <p className="text-sm text-primary-foreground/80 mt-1">Rating</p>
                  </div>
                  <div className="bg-primary-foreground/10 rounded-xl p-4 border border-primary-foreground/20 backdrop-blur-sm">
                    <p className="text-3xl font-bold">{travel.review_count || 0}</p>
                    <p className="text-sm text-primary-foreground/80 mt-1">Review</p>
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
