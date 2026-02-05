import { useState, useEffect } from 'react';
import { Menu, X, BarChart3, Package, MessageSquare, Users, Sparkles, ClipboardList, TrendingUp, Zap, Crown, Globe, Settings, ChevronDown, AlertCircle, DollarSign, Wallet, Briefcase, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  category: 'dashboard' | 'operations' | 'monetization' | 'settings';
  description?: string;
}

interface AgentDashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUnreadCount?: number;
  bookingOverdueCount?: number;
  hajiPendingCount?: number;
  inquiryPendingCount?: number;
}

export const AgentDashboardSidebar = ({
  activeTab,
  onTabChange,
  chatUnreadCount = 0,
  bookingOverdueCount = 0,
  hajiPendingCount = 0,
  inquiryPendingCount = 0,
}: AgentDashboardSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('dashboard');

  // Sync expanded category with active tab on mount
  useEffect(() => {
    const activeItem = navItems.find(item => item.id === activeTab);
    if (activeItem) {
      setExpandedCategory(activeItem.category);
    }
  }, []);

  const navItems: NavItem[] = [
    // Dashboard & Analytics
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      category: 'dashboard',
      description: 'Ringkasan performa bisnis Anda',
    },
    {
      id: 'analytics',
      label: 'Analytics Mendalam',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'dashboard',
      description: 'Laporan detail dan insight bisnis',
    },

    // Operations Management
    {
      id: 'packages',
      label: 'Paket Umroh',
      icon: <Package className="w-4 h-4" />,
      category: 'operations',
      description: 'Kelola semua paket perjalanan',
    },
    {
      id: 'bookings',
      label: 'Booking & Pembayaran',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: bookingOverdueCount,
      category: 'operations',
      description: 'Pantau reservasi dan status pembayaran',
    },
    {
      id: 'inquiries',
      label: 'Inquiry Pelanggan',
      icon: <Users className="w-4 h-4" />,
      badge: inquiryPendingCount,
      category: 'operations',
      description: 'Kelola pertanyaan dari calon pelanggan',
    },
    {
      id: 'chat',
      label: 'Chat & Komunikasi',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: chatUnreadCount,
      category: 'operations',
      description: 'Percakapan dengan pelanggan',
    },
    {
      id: 'haji',
      label: 'Pendaftaran Haji',
      icon: <Briefcase className="w-4 h-4" />,
      badge: hajiPendingCount,
      category: 'operations',
      description: 'Manajemen pendaftaran haji',
    },

    // Monetization & Revenue
    {
      id: 'membership',
      label: 'Membership Premium',
      icon: <Crown className="w-4 h-4" />,
      category: 'monetization',
      description: 'Upgrade ke paket premium',
    },
    {
      id: 'credits',
      label: 'Beli Kredit',
      icon: <Zap className="w-4 h-4" />,
      category: 'monetization',
      description: 'Kelola saldo kredit Anda',
    },
    {
      id: 'featured',
      label: 'Featured Package',
      icon: <Sparkles className="w-4 h-4" />,
      category: 'monetization',
      description: 'Promosikan paket unggulan',
    },

    // Settings & Configuration
    {
      id: 'website',
      label: 'Website Builder',
      icon: <Globe className="w-4 h-4" />,
      category: 'settings',
      description: 'Buat website bisnis Anda',
    },
  ];

  const categories = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: <BarChart3 className="w-4 h-4" />, color: 'text-blue-500' },
    { id: 'operations', label: 'Manajemen Operasional', icon: <Briefcase className="w-4 h-4" />, color: 'text-green-500' },
    { id: 'monetization', label: 'Monetisasi & Revenue', icon: <DollarSign className="w-4 h-4" />, color: 'text-amber-500' },
    { id: 'settings', label: 'Pengaturan & Tools', icon: <Settings className="w-4 h-4" />, color: 'text-purple-500' },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {categories.map((category) => {
          const categoryItems = navItems.filter(item => item.category === category.id);
          if (categoryItems.length === 0) return null;

          const isExpanded = expandedCategory === category.id;
          const hasActiveChild = categoryItems.some(item => item.id === activeTab);

          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group',
                  isExpanded || hasActiveChild ? 'bg-secondary/40' : 'hover:bg-secondary/20'
                )}
              >
                <div className={cn('p-1.5 rounded-md bg-background border border-border shadow-sm group-hover:scale-110 transition-transform', category.color)}>
                  {category.icon}
                </div>
                <span className="flex-1 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  {category.label}
                </span>
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 text-muted-foreground transition-transform duration-300',
                  isExpanded && 'rotate-180'
                )} />
              </button>

              {/* Category Items */}
              <div className={cn(
                'space-y-1 overflow-hidden transition-all duration-300 ease-in-out',
                isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
              )}>
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group ml-2',
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                  >
                    <span className={cn('flex-shrink-0 transition-transform group-hover:scale-110', activeTab === item.id ? 'text-white' : 'text-muted-foreground')}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={cn(
                        'flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse',
                        activeTab === item.id
                          ? 'bg-white text-primary'
                          : 'bg-destructive text-white'
                      )}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Help Card */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-125 transition-transform duration-500">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-primary/20">
                <Crown className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="font-bold text-xs text-primary">Tips Monetisasi</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Upgrade ke Premium untuk fitur lebih banyak dan jangkauan lebih luas.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full h-8 text-[10px] font-bold border-primary/20 hover:bg-primary hover:text-white transition-all"
              onClick={() => handleTabChange('membership')}
            >
              Upgrade Sekarang
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Floating for better access */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl transition-all duration-300 border-2",
            isOpen ? "bg-background text-foreground border-border rotate-90" : "bg-primary text-primary-foreground border-primary/20 scale-110"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-64px)] w-72 bg-background/95 backdrop-blur-md border-r border-border overflow-hidden transition-all duration-500 z-40',
          'lg:relative lg:top-0 lg:h-auto lg:bg-background',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
};
