import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Settings, ChevronDown, User, LogOut } from 'lucide-react';
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

interface AgentDashboardHeaderProps {
  travelName?: string;
  travelLogo?: string;
  onBack?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void;
  unreadNotifications?: number;
}

export const AgentDashboardHeader = ({
  travelName = 'Dashboard Agent',
  travelLogo,
  onBack,
  onNotifications,
  onSettings,
  userEmail,
  userAvatar,
  onLogout,
  unreadNotifications = 0,
}: AgentDashboardHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 glass border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between backdrop-blur-md bg-background/80"
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
            title="Kembali ke beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="font-bold text-lg lg:text-xl">{travelName}</h1>
          <p className="text-xs text-muted-foreground">Kelola bisnis umroh Anda</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNotifications}
          className="relative w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          title="Notifikasi"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-[10px]">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Badge>
          )}
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSettings}
          className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          title="Pengaturan"
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={userAvatar} alt="User" />
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {userEmail && (
              <>
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-semibold text-foreground">{userEmail}</p>
                  <p className="text-xs text-muted-foreground">Agent Account</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan Akun
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};
