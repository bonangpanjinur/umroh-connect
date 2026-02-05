import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bell, Settings, ChevronDown, User, LogOut, 
  Search, Plus, Home, ChevronRight, Package, Users, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AgentDashboardHeaderProps {
  travelName?: string;
  travelLogo?: string;
  activeTab: string;
  onBack?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void;
  unreadNotifications?: number;
  onCreatePackage?: () => void;
  onEditTravel?: () => void;
}

export const AgentDashboardHeader = ({
  travelName = 'Dashboard Agent',
  travelLogo,
  activeTab,
  onBack,
  onNotifications,
  onSettings,
  userEmail,
  userAvatar,
  onLogout,
  unreadNotifications = 0,
  onCreatePackage,
  onEditTravel,
}: AgentDashboardHeaderProps) => {
  
  const getBreadcrumb = (tab: string) => {
    const labels: Record<string, string> = {
      overview: 'Overview',
      analytics: 'Analytics',
      packages: 'Paket Umroh',
      bookings: 'Booking & Pembayaran',
      inquiries: 'Inquiry Pelanggan',
      chat: 'Chat & Komunikasi',
      haji: 'Pendaftaran Haji',
      membership: 'Membership Premium',
      credits: 'Beli Kredit',
      featured: 'Featured Package',
      website: 'Website Builder',
    };
    return labels[tab] || 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Left Section: Breadcrumbs & Search */}
      <div className="flex items-center gap-6 flex-1">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{getBreadcrumb(activeTab)}</span>
        </div>
        
        <div className="relative max-w-md w-full hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari booking, paket, atau jamaah..." 
            className="pl-10 bg-secondary/50 border-none h-9 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right Section: Actions & User */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Quick Action Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="hidden sm:flex gap-2 h-9 px-4 rounded-full shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Quick Action</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer" onClick={onCreatePackage}>
              <Package className="w-4 h-4 mr-2 text-primary" />
              Buat Paket Baru
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              Tambah Jamaah
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
              Kirim Broadcast
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={onEditTravel}>
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan Travel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 border-l border-border ml-2 pl-2 lg:ml-4 lg:pl-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotifications}
            className="relative h-9 w-9 rounded-full hover:bg-secondary"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-10 rounded-full hover:bg-secondary transition-colors">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={userAvatar} alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {userEmail?.substring(0, 2).toUpperCase() || 'AG'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold leading-none mb-1">{travelName}</p>
                  <p className="text-[10px] text-muted-foreground leading-none truncate max-w-[100px]">{userEmail}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1">
              <div className="px-2 py-2 text-sm lg:hidden">
                <p className="font-bold text-foreground">{travelName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <DropdownMenuSeparator className="lg:hidden" />
              <DropdownMenuItem onClick={() => onSettings?.()}>
                <User className="w-4 h-4 mr-2" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSettings?.()}>
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
