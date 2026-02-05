import { useState, useEffect } from 'react';
import { 
  Menu, X, BarChart3, Package, MessageSquare, Users, Sparkles, 
  ClipboardList, TrendingUp, Zap, Crown, Globe, Settings, 
  ChevronDown, AlertCircle, DollarSign, Wallet, Briefcase, 
  LayoutDashboard, ChevronLeft, ChevronRight, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  category: 'bisnis' | 'marketing' | 'pengaturan';
  description?: string;
}

interface AgentDashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUnreadCount?: number;
  bookingOverdueCount?: number;
  hajiPendingCount?: number;
  inquiryPendingCount?: number;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const AgentDashboardSidebar = ({
  activeTab,
  onTabChange,
  chatUnreadCount = 0,
  bookingOverdueCount = 0,
  hajiPendingCount = 0,
  inquiryPendingCount = 0,
  isCollapsed = false,
  setIsCollapsed,
}: AgentDashboardSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['bisnis']);

  const navItems: NavItem[] = [
    // Bisnis Saya
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      category: 'bisnis',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'bisnis',
    },
    {
      id: 'packages',
      label: 'Paket Umroh',
      icon: <Package className="w-5 h-5" />,
      category: 'bisnis',
    },
    {
      id: 'bookings',
      label: 'Booking',
      icon: <ClipboardList className="w-5 h-5" />,
      badge: bookingOverdueCount,
      category: 'bisnis',
    },
    {
      id: 'haji',
      label: 'Haji',
      icon: <Briefcase className="w-5 h-5" />,
      badge: hajiPendingCount,
      category: 'bisnis',
    },

    // Marketing
    {
      id: 'inquiries',
      label: 'Leads / Inquiry',
      icon: <Users className="w-5 h-5" />,
      badge: inquiryPendingCount,
      category: 'marketing',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: chatUnreadCount,
      category: 'marketing',
    },
    {
      id: 'featured',
      label: 'Promosi Paket',
      icon: <Sparkles className="w-5 h-5" />,
      category: 'marketing',
    },

    // Pengaturan
    {
      id: 'website',
      label: 'Website Saya',
      icon: <Globe className="w-5 h-5" />,
      category: 'pengaturan',
    },
    {
      id: 'membership',
      label: 'Membership',
      icon: <Crown className="w-5 h-5" />,
      category: 'pengaturan',
    },
    {
      id: 'credits',
      label: 'Kredit',
      icon: <Zap className="w-5 h-5" />,
      category: 'pengaturan',
    },
  ];

  const categories = [
    { id: 'bisnis', label: 'Bisnis Saya', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'marketing', label: 'Marketing', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  const toggleCategory = (categoryId: string) => {
    if (isCollapsed) return;
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      {/* Collapse Toggle (Desktop) */}
      <div className="hidden lg:flex justify-end px-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed?.(!isCollapsed)}
          className="h-8 w-8 rounded-full bg-secondary/50 hover:bg-secondary"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">
        <TooltipProvider delayDuration={0}>
          {categories.map((category) => {
            const categoryItems = navItems.filter(item => item.category === category.id);
            const isExpanded = expandedCategories.includes(category.id);
            
            return (
              <div key={category.id} className="space-y-1">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    <span>{category.label}</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded ? "" : "-rotate-90")} />
                  </button>
                )}
                
                <div className={cn("space-y-1", !isCollapsed && !isExpanded && "hidden")}>
                  {categoryItems.map((item) => {
                    const isActive = activeTab === item.id;
                    
                    const content = (
                      <button
                        onClick={() => handleTabChange(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-xl transition-all duration-200 relative group',
                          isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:translate-x-1'
                        )}
                      >
                        <div className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                        )}>
                          {item.icon}
                        </div>
                        
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className={cn(
                                'flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm',
                                isActive ? 'bg-white text-primary' : 'bg-destructive text-white'
                              )}>
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </>
                        )}
                        
                        {isActive && !isCollapsed && (
                          <motion.div 
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-5 bg-white rounded-r-full"
                          />
                        )}
                        
                        {isCollapsed && item.badge && item.badge > 0 && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
                        )}
                      </button>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            {content}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.label} {item.badge && item.badge > 0 ? `(${item.badge})` : ''}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.id}>{content}</div>;
                  })}
                </div>
                
                {isCollapsed && <div className="h-px bg-border/50 mx-2 my-4" />}
              </div>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Quick Action (only when not collapsed) */}
      {!isCollapsed && (
        <div className="px-4 mt-4">
          <Button 
            className="w-full gap-2 shadow-md" 
            onClick={() => handleTabChange('packages')}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Paket Baru</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl transition-all duration-300 border-2",
            isOpen ? "bg-background text-foreground border-border" : "bg-primary text-primary-foreground border-primary/20"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-64px)] bg-background border-r border-border transition-all duration-300 z-40',
          'lg:relative lg:top-0 lg:h-auto',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
};
