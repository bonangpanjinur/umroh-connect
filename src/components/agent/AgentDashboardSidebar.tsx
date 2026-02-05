import { useState } from 'react';
import { Menu, X, BarChart3, Package, MessageSquare, Users, Sparkles, ClipboardList, TrendingUp, Zap, Crown, Globe, Settings, ChevronDown, AlertCircle, DollarSign, Wallet, Briefcase } from 'lucide-react';
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

  const navItems: NavItem[] = [
    // Dashboard & Analytics
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
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
    { id: 'dashboard', label: '📊 Dashboard & Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'operations', label: '⚙️ Manajemen Operasional', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'monetization', label: '💰 Monetisasi & Revenue', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'settings', label: '⚙️ Pengaturan & Tools', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const renderSidebarContent = () => (
    <nav className="p-4 space-y-2">
      {categories.map((category) => {
        const categoryItems = navItems.filter(item => item.category === category.id);
        if (categoryItems.length === 0) return null;

        const isExpanded = expandedCategory === category.id;

        return (
          <div key={category.id} className="space-y-1">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold',
                'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                isExpanded && 'text-foreground bg-secondary/50'
              )}
            >
              <span className="flex-shrink-0">{category.icon}</span>
              <span className="flex-1 text-left">{category.label}</span>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )} />
            </button>

            {/* Category Items */}
            {isExpanded && (
              <div className="space-y-1 pl-2 border-l-2 border-border">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-foreground hover:bg-secondary/70'
                    )}
                    title={item.description}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        activeTab === item.id
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-destructive text-white'
                      )}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Help Section */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="bg-primary/10 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-foreground mb-1">Tips Monetisasi</p>
              <p className="text-muted-foreground">Upgrade ke Premium untuk fitur lebih banyak dan jangkauan lebih luas</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-16 left-4 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-64px)] w-72 bg-background border-r border-border overflow-y-auto transition-all duration-300 z-40 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent',
          'lg:relative lg:top-0 lg:h-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
};
