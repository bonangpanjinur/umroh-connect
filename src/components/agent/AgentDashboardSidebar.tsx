import { useState } from 'react';
import { Menu, X, BarChart3, Package, MessageSquare, Users, Sparkles, ClipboardList, TrendingUp, Zap, Crown, Globe, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  category: 'management' | 'analytics' | 'settings';
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

  const navItems: NavItem[] = [
    // Overview & Analytics
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'analytics',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'analytics',
    },

    // Package Management
    {
      id: 'packages',
      label: 'Paket Umroh',
      icon: <Package className="w-4 h-4" />,
      category: 'management',
    },

    // Bookings & Payments
    {
      id: 'bookings',
      label: 'Booking & Pembayaran',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: bookingOverdueCount,
      category: 'management',
    },

    // Communication
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: chatUnreadCount,
      category: 'management',
    },
    {
      id: 'inquiries',
      label: 'Inquiry',
      icon: <Users className="w-4 h-4" />,
      badge: inquiryPendingCount,
      category: 'management',
    },

    // Haji Management
    {
      id: 'haji',
      label: 'Pendaftaran Haji',
      icon: <Users className="w-4 h-4" />,
      badge: hajiPendingCount,
      category: 'management',
    },

    // Premium Features
    {
      id: 'membership',
      label: 'Membership',
      icon: <Crown className="w-4 h-4" />,
      category: 'settings',
    },
    {
      id: 'credits',
      label: 'Credits',
      icon: <Zap className="w-4 h-4" />,
      category: 'settings',
    },

    // Website & Marketing
    {
      id: 'website',
      label: 'Website',
      icon: <Globe className="w-4 h-4" />,
      category: 'settings',
    },
    {
      id: 'featured',
      label: 'Featured Package',
      icon: <Sparkles className="w-4 h-4" />,
      category: 'settings',
    },
  ];

  const categories = [
    { id: 'analytics', label: 'Analytics & Reporting' },
    { id: 'management', label: 'Manajemen Operasional' },
    { id: 'settings', label: 'Pengaturan & Premium' },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

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
          'fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-background border-r border-border overflow-y-auto transition-all duration-300 z-40',
          'lg:relative lg:top-0 lg:h-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-6">
          {categories.map((category) => {
            const categoryItems = navItems.filter(item => item.category === category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  {category.label}
                </h3>
                <div className="space-y-1">
                  {categoryItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group',
                        activeTab === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary'
                      )}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
