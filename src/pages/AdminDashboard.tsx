import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Building2, CreditCard, Image, Settings, BarChart3, Database, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { TravelsManagement } from '@/components/admin/TravelsManagement';
import { MembershipsManagement } from '@/components/admin/MembershipsManagement';
import { BannersManagement } from '@/components/admin/BannersManagement';
import { CreditsManagement } from '@/components/admin/CreditsManagement';
import { PlatformSettings } from '@/components/admin/PlatformSettings';
import { MasterDataManagement } from '@/components/admin/MasterDataManagement';
import { PrayersManagement } from '@/components/admin/PrayersManagement';
import { ReviewsManagement } from '@/components/admin/ReviewsManagement';
import { FeaturedManagement } from '@/components/admin/FeaturedManagement';

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Kelola platform Arah Umroh</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 lg:grid-cols-11 gap-2 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="travels" className="flex items-center gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Travels</span>
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2 py-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Featured</span>
            </TabsTrigger>
            <TabsTrigger value="master" className="flex items-center gap-2 py-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Master</span>
            </TabsTrigger>
            <TabsTrigger value="prayers" className="flex items-center gap-2 py-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Doa</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2 py-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Review</span>
            </TabsTrigger>
            <TabsTrigger value="memberships" className="flex items-center gap-2 py-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Member</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2 py-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Kredit</span>
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex items-center gap-2 py-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Banner</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Setting</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminStatsCards />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="travels">
            <TravelsManagement />
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedManagement />
          </TabsContent>

          <TabsContent value="master">
            <MasterDataManagement />
          </TabsContent>

          <TabsContent value="prayers">
            <PrayersManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="memberships">
            <MembershipsManagement />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsManagement />
          </TabsContent>

          <TabsContent value="banners">
            <BannersManagement />
          </TabsContent>

          <TabsContent value="settings">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
