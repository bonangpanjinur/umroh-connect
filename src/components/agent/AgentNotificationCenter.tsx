import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, CheckCheck, MessageSquare, 
  CreditCard, Calendar, Users, Clock, AlertTriangle,
  Sparkles, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  useAgentNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useTriggerNotificationCheck,
  AgentNotification 
} from '@/hooks/useAgentNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

interface AgentNotificationCenterProps {
  travelId?: string;
  onNavigate?: (tab: string, referenceId?: string) => void;
}

const notificationConfig: Record<AgentNotification['notification_type'], {
  icon: typeof Bell;
  color: string;
  bgColor: string;
  tab: string;
}> = {
  new_inquiry: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    tab: 'inquiries',
  },
  overdue_payment: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950',
    tab: 'bookings',
  },
  new_booking: {
    icon: Sparkles,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950',
    tab: 'bookings',
  },
  new_haji_registration: {
    icon: Users,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    tab: 'haji',
  },
};

const NotificationItem = ({ 
  notification, 
  onRead, 
  onNavigate 
}: { 
  notification: AgentNotification; 
  onRead: (id: string) => void;
  onNavigate?: (tab: string, referenceId?: string) => void;
}) => {
  const config = notificationConfig[notification.notification_type];
  const Icon = config.icon;
  
  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (onNavigate && notification.reference_id) {
      onNavigate(config.tab, notification.reference_id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={handleClick}
      className={`p-3 rounded-xl cursor-pointer transition-all ${
        notification.is_read 
          ? 'bg-muted/30' 
          : 'bg-card border border-border shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className={`text-xs mt-0.5 ${notification.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
            {notification.body}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true, 
                locale: idLocale 
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AgentNotificationCenter = ({ travelId, onNavigate }: AgentNotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, isLoading, unreadCount } = useAgentNotifications(travelId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const triggerCheck = useTriggerNotificationCheck();

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    if (travelId) {
      markAllRead.mutate(travelId, {
        onSuccess: () => {
          toast.success('Semua notifikasi ditandai sudah dibaca');
        },
      });
    }
  };

  const handleRefresh = () => {
    triggerCheck.mutate(undefined, {
      onSuccess: (data: any) => {
        if (data?.details) {
          const details = data.details as Record<string, number>;
          const total = Object.values(details).reduce((a, b) => a + b, 0);
          if (total > 0) {
            toast.success(`${total} notifikasi baru ditemukan`);
          } else {
            toast.info('Tidak ada notifikasi baru');
          }
        }
      },
      onError: () => {
        toast.error('Gagal memeriksa notifikasi');
      },
    });
  };

  const handleNavigate = (tab: string, referenceId?: string) => {
    setIsOpen(false);
    onNavigate?.(tab, referenceId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifikasi
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} baru
                </Badge>
              )}
            </SheetTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                disabled={triggerCheck.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${triggerCheck.isPending ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Tandai Semua
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleMarkRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Belum ada notifikasi</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleRefresh}
                  disabled={triggerCheck.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${triggerCheck.isPending ? 'animate-spin' : ''}`} />
                  Periksa Sekarang
                </Button>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AgentNotificationCenter;