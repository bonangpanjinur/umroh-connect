import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, Plus, Package, AlertCircle, Edit2, 
  BarChart3, MessageSquare, Users, Sparkles, ClipboardList, 
  TrendingUp, Zap, Crown, Globe, Bell, Settings, LayoutDashboard, 
  Share2, ExternalLink, Star, DollarSign, MousePointer2, 
  ArrowUpRight, ArrowDownRight, Calendar, Clock
} from 'lucide-react';
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
import { AgentDashboardHeader } from '@/components/agent/AgentDashboardHeader';
import { Package as PackageType } from '@/types/database';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const renderOverview = () => {
    const totalBookings = bookingStats.totalBookings || 0;
    const totalRevenue = bookingStats.totalRevenue || 0;
    const totalLeads = inquiryStats?.total || 0;

    return (
      <div className="space-y-6">
        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main Stat: Revenue */}
          <Card className="lg:col-span-2 overflow-hidden border-none shadow-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="h-24 w-24" />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-none backdrop-blur-sm">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5%
                </Badge>
              </div>
              <p className="text-primary-foreground/80 text-sm font-medium">Total Pendapatan</p>
              <h3 className="text-3xl lg:text-4xl font-black mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
              <div className="mt-6 flex items-center gap-4 text-xs text-primary-foreground/60">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> 30 Hari Terakhir
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Update: Baru saja
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stat: Bookings */}
          <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-medium">Total Booking</p>
              <h3 className="text-2xl font-bold mt-1">{totalBookings}</h3>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> 5 booking baru minggu ini
              </p>
            </CardContent>
          </Card>

          {/* Stat: Leads */}
          <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                  <Users className="h-6 w-6" />
                </div>
                {inquiryStats?.pending > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {inquiryStats.pending} Baru
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm font-medium">Lead Masuk</p>
              <h3 className="text-2xl font-bold mt-1">{totalLeads}</h3>
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {inquiryStats?.pending || 0} perlu direspon segera
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Charts & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InterestTrendChart data={trendData || []} isLoading={trendLoading} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PackageStatsCard stats={packageStats || []} isLoading={statsLoading} />
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Konversi Lead
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-secondary stroke-current"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary stroke-current"
                        strokeWidth="3"
                        strokeDasharray="65, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">65%</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Rate</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Performa konversi Anda meningkat 12% dari bulan lalu. Pertahankan!</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Quick Links Bento Card */}
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="pb-2 bg-secondary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Aksi Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 p-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-secondary/30 border-none hover:bg-primary hover:text-white transition-all duration-300 group" onClick={() => {
                  setEditingPackage(null);
                  setShowPackageForm(true);
                }}>
                  <Plus className="w-5 h-5 text-primary group-hover:text-white" />
                  <span className="text-xs">Paket Baru</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-secondary/30 border-none hover:bg-blue-500 hover:text-white transition-all duration-300 group" onClick={() => setActiveTab('website')}>
                  <Globe className="w-5 h-5 text-blue-500 group-hover:text-white" />
                  <span className="text-xs">Edit Website</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-secondary/30 border-none hover:bg-green-500 hover:text-white transition-all duration-300 group" onClick={() => setActiveTab('chat')}>
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 text-green-500 group-hover:text-white" />
                    {chatUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </div>
                  <span className="text-xs">Buka Chat</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-secondary/30 border-none hover:bg-purple-500 hover:text-white transition-all duration-300 group" onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="w-5 h-5 text-purple-500 group-hover:text-white" />
                  <span className="text-xs">Analitik</span>
                </Button>
              </CardContent>
            </Card>

            <AgentMembershipCard travelId={travel?.id || ''} />
            
            {/* Website Status Card */}
            <Card className="border-none shadow-md bg-secondary/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm">Status Website</h4>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border mb-4">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-mono truncate flex-1">umroh.connect/{travel?.id.substring(0, 8)}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs text-primary" onClick={() => setActiveTab('website')}>
                  Kelola Domain & SEO
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {(() => {
            switch (activeTab) {
              case 'overview':
                return renderOverview();
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
                      }} className="gap-2 w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20">
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
                      <p className="text-sm text-muted-foreground mt-1">Kelola pendaftaran haji reguler dan khusus</p>
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
      <AgentDashboardHeader 
        travelName={travel?.name}
        activeTab={activeTab}
        userEmail={user?.email}
        userAvatar={profile?.avatar_url || undefined}
        onLogout={() => navigate('/auth')}
        unreadNotifications={0}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full relative">
        <AgentDashboardSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatUnreadCount={chatUnreadCount}
          bookingOverdueCount={bookingStats.overduePayments}
          hajiPendingCount={hajiStats?.pending || 0}
          inquiryPendingCount={inquiryStats?.pending || 0}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden bg-secondary/10">
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
            <div className="max-w-[1400px] mx-auto space-y-8">
              {/* Welcome Header */}
              {activeTab === 'overview' && (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Selamat datang kembali,</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight">{travel.name}</h2>
                    <p className="text-muted-foreground text-sm">Berikut adalah ringkasan performa bisnis Anda hari ini.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl gap-2 bg-background" onClick={handleShare}>
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
              )}

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
