import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Package, AlertCircle, Edit2, BarChart3, MessageSquare, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAgentTravel, useAgentPackages } from '@/hooks/useAgentData';
import { usePackageStats, useInterestTrend } from '@/hooks/usePackageInterests';
import { useInquiryStats } from '@/hooks/useInquiries';
import { useHajiStats } from '@/hooks/useHaji';
import TravelForm from '@/components/agent/TravelForm';
import PackageForm from '@/components/agent/PackageForm';
import PackageCardAgent from '@/components/agent/PackageCardAgent';
import PackageStatsCard from '@/components/agent/PackageStatsCard';
import InterestTrendChart from '@/components/agent/InterestTrendChart';
import { InquiriesManagement } from '@/components/agent/InquiriesManagement';
import { HajiManagement } from '@/components/agent/HajiManagement';
import { FeaturedPackageManager } from '@/components/agent/FeaturedPackageManager';
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

  // Redirect if not logged in or not agent
  useEffect(() => {
    if (!authLoading && (!user || (profile && profile.role !== 'agent' && profile.role !== 'admin'))) {
      navigate('/');
    }
  }, [authLoading, user, profile, navigate]);

  if (authLoading || travelLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex justify-center">
        <div className="w-full max-w-md bg-background min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Check if user has agent role
  if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-secondary/30 flex justify-center">
        <div className="w-full max-w-md bg-background min-h-screen flex flex-col items-center justify-center p-6 text-center">
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

  return (
    <div className="min-h-screen bg-secondary/30 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3 flex items-center gap-3">
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
        </header>

        <main className="p-4 pb-24 space-y-4">
          {/* Travel Card */}
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
                className="bg-gradient-primary text-primary-foreground rounded-2xl p-4 shadow-primary"
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

              {/* Tabs for different sections */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="text-xs px-2">Overview</TabsTrigger>
                  <TabsTrigger value="packages" className="text-xs px-2">Paket</TabsTrigger>
                  <TabsTrigger value="featured" className="text-xs px-2">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured
                  </TabsTrigger>
                  <TabsTrigger value="haji" className="relative text-xs px-2">
                    Haji
                    {hajiStats && hajiStats.pending > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {hajiStats.pending}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="inquiries" className="relative text-xs px-2">
                    Inquiry
                    {inquiryStats && inquiryStats.pending > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                        {inquiryStats.pending}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <InterestTrendChart data={trendData || []} isLoading={trendLoading} />
                  <PackageStatsCard stats={packageStats || []} isLoading={statsLoading} />
                </TabsContent>

                <TabsContent value="packages" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      Paket Umroh & Haji
                    </h3>
                    <Button size="sm" onClick={() => setShowPackageForm(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Tambah
                    </Button>
                  </div>

                  {packagesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : packages && packages.length > 0 ? (
                    <div className="space-y-4">
                      {packages.map((pkg) => (
                        <PackageCardAgent
                          key={pkg.id}
                          package={pkg}
                          onEdit={() => setEditingPackage(pkg)}
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-card rounded-2xl border-2 border-dashed border-border p-8 text-center"
                    >
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h4 className="font-medium mb-1">Belum Ada Paket</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Mulai buat paket umroh atau haji pertama Anda
                      </p>
                      <Button onClick={() => setShowPackageForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Buat Paket
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="featured" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Paket Unggulan
                    </h3>
                  </div>
                  <FeaturedPackageManager travelId={travel?.id} />
                </TabsContent>

                <TabsContent value="haji" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      Pendaftaran Haji
                    </h3>
                  </div>
                  <HajiManagement travelId={travel?.id} />
                </TabsContent>

                <TabsContent value="inquiries" className="mt-4">
                  <InquiriesManagement />
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>

        {/* Modals */}
        <AnimatePresence>
          {showTravelForm && (
            <TravelForm
              travel={travel}
              onClose={() => setShowTravelForm(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(showPackageForm || editingPackage) && travel && (
            <PackageForm
              travelId={travel.id}
              package={editingPackage}
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
