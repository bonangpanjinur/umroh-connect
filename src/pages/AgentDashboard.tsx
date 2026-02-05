import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Package, AlertCircle, Edit2, BarChart3, MessageSquare, Users, Sparkles, ClipboardList, TrendingUp, Zap, Crown, Globe, Bell, Settings, LayoutDashboard, Share2, ExternalLink } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-ping absolute inset-0" />
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full relative" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Memuat dashboard Anda...</p>
        </div>
      </div>
    );
  }

  // Check if user has agent role
  if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Anda tidak memiliki akses ke dashboard agent. Hubungi admin untuk upgrade akun Anda.
        </p>
        <Button size="lg" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  const handleNotificationNavigate = (tab: string, referenceId?: string) => {
    setActiveTab(tab);
  };

  const handleShare = () => {
    if (travel) {
      const url = `${window.location.origin}/travel/${travel.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Link profil travel berhasil disalin!');
    }
  };

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {(() => {
            switch (activeTab) {
              case 'overview':
                return (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      <div className="xl:col-span-2 space-y-8">
                        <InterestTrendChart data={trendData || []} isLoading={trendLoading} />
                        <PackageStatsCard stats={packageStats || []} isLoading={statsLoading} />
                      </div>
                      <div className="space-y-8">
                        <AgentMembershipCard travelId={travel?.id || ''} />
                        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 border border-border shadow-sm">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Aksi Cepat
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-background/50" onClick={() => {
                              setEditingPackage(null);
                              setShowPackageForm(true);
                            }}>
                              <Plus className="w-5 h-5 text-primary" />
                              <span className="text-xs">Tambah Paket</span>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-background/50" onClick={() => setActiveTab('website')}>
                              <Globe className="w-5 h-5 text-blue-500" />
                              <span className="text-xs">Website Builder</span>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-background/50" onClick={() => setActiveTab('chat')}>
                              <MessageSquare className="w-5 h-5 text-green-500" />
                              <span className="text-xs">Buka Chat</span>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-background/50" onClick={() => setActiveTab('analytics')}>
                              <BarChart3 className="w-5 h-5 text-purple-500" />
                              <span className="text-xs">Lihat Analitik</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              case 'analytics':
                return <AnalyticsDashboard travelId={travel?.id || ''} />;
              case 'packages':
                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-2xl">Daftar Paket Umroh</h3>
                        <p className="text-sm text-muted-foreground mt-1">Kelola semua paket perjalanan Anda</p>
                      </div>
                      <Button size="lg" onClick={() => {
                        setEditingPackage(null);
                        setShowPackageForm(true);
                      }} className="gap-2 w-full sm:w-auto">
                        <Plus className="w-4 h-4" /> Tambah Paket
                      </Button>
                    </div>
                    
                    {packagesLoading ? (
                      <div className="flex justify-center py-24">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
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
                        className="text-center py-24 bg-secondary/20 rounded-3xl border-2 border-dashed border-border"
                      >
                        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Package className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-xl font-bold text-foreground mb-2">Belum ada paket umroh</p>
                        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">Mulai buat paket pertama Anda untuk menarik pelanggan</p>
                        <Button size="lg" onClick={() => {
                          setEditingPackage(null);
                          setShowPackageForm(true);
                        }} className="rounded-full px-8">
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
                return (
                  <div className="max-w-4xl mx-auto">
                    <AgentMembershipCard travelId={travel?.id || ''} />
                  </div>
                );
              case 'credits':
                return <AgentCreditsManager travelId={travel?.id || ''} />;
              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full hover:bg-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">Dashboard Agent</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                {travel?.name || 'Kelola Bisnis Anda'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {travel && (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">{travel.verified ? 'Verified Agent' : 'Agent'}</span>
                </div>
                <AgentNotificationCenter 
                  travelId={travel.id} 
                  onNavigate={handleNotificationNavigate}
                />
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => setActiveTab('settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full relative">
        {/* Sidebar Navigation */}
        <AgentDashboardSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatUnreadCount={chatUnreadCount}
          bookingOverdueCount={bookingStats.overduePayments}
          hajiPendingCount={hajiStats?.pending || 0}
          inquiryPendingCount={inquiryStats?.pending || 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          {!travel ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border border-border rounded-3xl p-8 lg:p-12 text-center max-w-2xl mx-auto shadow-sm"
            >
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Building2 className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-bold text-3xl mb-4">Mulai Perjalanan Bisnis Anda</h3>
              <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                Anda perlu membuat profil travel terlebih dahulu sebelum bisa menambahkan paket umroh dan mulai menerima booking dari pelanggan.
              </p>
              <Button size="lg" onClick={() => setShowTravelForm(true)} className="gap-2 px-8 py-6 rounded-2xl text-lg shadow-xl shadow-primary/20">
                <Plus className="w-5 h-5" /> Buat Profil Travel
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* Modern Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Selamat datang kembali,</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tight">{travel.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      {packages?.length || 0} Paket
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      {travel.rating || 0} ({travel.review_count || 0} ulasan)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-xl gap-2" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button variant="default" className="rounded-xl gap-2 shadow-lg shadow-primary/20" asChild>
                    <a href={`/travel/${travel.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Lihat Profil
                    </a>
                  </Button>
                </div>
              </div>

              {/* Dynamic Content */}
              {renderContent()}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <TravelForm 
        open={showTravelForm} 
        onOpenChange={setShowTravelForm}
        initialData={travel || undefined}
      />
      
      <PackageForm
        open={showPackageForm}
        onOpenChange={setShowPackageForm}
        editingPackage={editingPackage || undefined}
        travelId={travel?.id}
      />
    </div>
  );
};

export default AgentDashboard;
