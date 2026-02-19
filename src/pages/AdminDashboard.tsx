import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Users, Building2, CreditCard, Image, Settings, BarChart3, 
  Database, BookOpen, MessageSquare, Sparkles, FileText, LineChart, Bug, 
  Crown, Wallet, Newspaper, Fingerprint, Globe, Layout, ShoppingBag, 
  Tag, PackageCheck, ChevronDown, Menu, X
} from 'lucide-react';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AdminAnalyticsDashboard } from '@/components/admin/AdminAnalyticsDashboard';
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
import { ContentManagement } from '@/components/admin/ContentManagement';
import { PagesManagement } from '@/components/admin/PagesManagement';
import FeedbackManagement from '@/components/admin/FeedbackManagement';
import SubscriptionsManagement from '@/components/admin/SubscriptionsManagement';
import { PaymentGatewaySettings } from '@/components/admin/PaymentGatewaySettings';
import { TasbihManagement } from '@/components/admin/TasbihManagement';
import { AgentUrlManagement } from '@/components/admin/AgentUrlManagement';
import WebsiteTemplatesManagement from '@/components/admin/WebsiteTemplatesManagement';
import ShopProductsManagement from '@/components/admin/ShopProductsManagement';
import ShopCategoriesManagement from '@/components/admin/ShopCategoriesManagement';
import ShopOrdersManagement from '@/components/admin/ShopOrdersManagement';
import ShopDashboard from '@/components/admin/ShopDashboard';
import SellerManagement from '@/components/admin/SellerManagement';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'analytics', label: 'Analitik', icon: <LineChart className="h-4 w-4" /> },
      { id: 'settings', label: 'Setting', icon: <Settings className="h-4 w-4" /> },
      { id: 'feedback', label: 'Feedback', icon: <Bug className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Pengguna & Agen',
    items: [
      { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
      { id: 'travels', label: 'Travels', icon: <Building2 className="h-4 w-4" /> },
      { id: 'memberships', label: 'Membership', icon: <CreditCard className="h-4 w-4" /> },
      { id: 'credits', label: 'Kredit', icon: <CreditCard className="h-4 w-4" /> },
      { id: 'urls', label: 'URL Agent', icon: <Globe className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Konten',
    items: [
      { id: 'pages', label: 'Halaman', icon: <Newspaper className="h-4 w-4" /> },
      { id: 'banners', label: 'Banner', icon: <Image className="h-4 w-4" /> },
      { id: 'content', label: 'Konten', icon: <FileText className="h-4 w-4" /> },
      { id: 'templates', label: 'Template', icon: <Layout className="h-4 w-4" /> },
      { id: 'master', label: 'Master Data', icon: <Database className="h-4 w-4" /> },
      { id: 'prayers', label: 'Doa', icon: <BookOpen className="h-4 w-4" /> },
      { id: 'tasbih', label: 'Tasbih', icon: <Fingerprint className="h-4 w-4" /> },
      { id: 'reviews', label: 'Review', icon: <MessageSquare className="h-4 w-4" /> },
    ],
  },
  {
    label: 'E-Commerce',
    items: [
      { id: 'shop-dashboard', label: 'Dashboard Toko', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'shop-products', label: 'Produk', icon: <ShoppingBag className="h-4 w-4" /> },
      { id: 'shop-categories', label: 'Kategori', icon: <Tag className="h-4 w-4" /> },
      { id: 'shop-orders', label: 'Pesanan', icon: <PackageCheck className="h-4 w-4" /> },
      { id: 'sellers', label: 'Seller', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Pembayaran',
    items: [
      { id: 'payment', label: 'Gateway', icon: <Wallet className="h-4 w-4" /> },
      { id: 'subscriptions', label: 'Langganan Tracker', icon: <Crown className="h-4 w-4" /> },
      { id: 'featured', label: 'Featured', icon: <Sparkles className="h-4 w-4" /> },
    ],
  },
];

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(g => { initial[g.label] = true; });
    return initial;
  });

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

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const activeLabel = navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Overview';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminStatsCards />;
      case 'analytics': return <AdminAnalyticsDashboard />;
      case 'users': return <UsersManagement />;
      case 'travels': return <TravelsManagement />;
      case 'subscriptions': return <SubscriptionsManagement />;
      case 'payment': return <PaymentGatewaySettings />;
      case 'featured': return <FeaturedManagement />;
      case 'content': return <ContentManagement />;
      case 'master': return <MasterDataManagement />;
      case 'prayers': return <PrayersManagement />;
      case 'tasbih': return <TasbihManagement />;
      case 'reviews': return <ReviewsManagement />;
      case 'memberships': return <MembershipsManagement />;
      case 'credits': return <CreditsManagement />;
      case 'banners': return <BannersManagement />;
      case 'feedback': return <FeedbackManagement />;
      case 'settings': return <PlatformSettings />;
      case 'pages': return <PagesManagement />;
      case 'urls': return <AgentUrlManagement />;
      case 'templates': return <WebsiteTemplatesManagement />;
      case 'shop-products': return <ShopProductsManagement />;
      case 'shop-categories': return <ShopCategoriesManagement />;
      case 'shop-orders': return <ShopOrdersManagement />;
      case 'shop-dashboard': return <ShopDashboard />;
      case 'sellers': return <SellerManagement />;
      default: return <AdminStatsCards />;
    }
  };

  const sidebarContent = (
    <nav className="space-y-1 p-3">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-2">
          <button
            onClick={() => toggleGroup(group.label)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {group.label}
            <ChevronDown className={cn("h-3 w-3 transition-transform", expandedGroups[group.label] && "rotate-180")} />
          </button>
          {expandedGroups[group.label] && (
            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-bold">Admin</h1>
            <p className="text-xs text-muted-foreground">Arah Umroh</p>
          </div>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border overflow-y-auto animate-fade-in">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h1 className="text-base font-bold">Admin</h1>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="px-4 lg:px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{activeLabel}</h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
