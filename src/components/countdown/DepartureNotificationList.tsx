import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Bell, Check, Clock, Calendar, X,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  useDepartureNotifications, 
  useMarkDepartureNotificationRead,
  useMarkAllDepartureNotificationsRead,
  notificationTypeLabels,
  notificationTypeColors 
} from '@/hooks/useDepartureNotifications';

interface DepartureNotificationListProps {
  onViewBooking?: (bookingId: string) => void;
  maxItems?: number;
  showHeader?: boolean;
}

const DepartureNotificationList = ({ 
  onViewBooking,
  maxItems = 10,
  showHeader = true 
}: DepartureNotificationListProps) => {
  const { data: notifications, isLoading } = useDepartureNotifications();
  const markRead = useMarkDepartureNotificationRead();
  const markAllRead = useMarkAllDepartureNotificationsRead();

  const displayedNotifications = (notifications || []).slice(0, maxItems);
  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Plane className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-medium mb-1">Belum Ada Pengingat</h3>
          <p className="text-sm text-muted-foreground">
            Pengingat keberangkatan akan muncul di sini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Pengingat Keberangkatan
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} baru
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                <span className="text-xs">Baca Semua</span>
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 pt-2 space-y-2">
            <AnimatePresence>
              {displayedNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div
                    className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      !notification.is_read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markRead.mutate(notification.id);
                      }
                      if (notification.booking_id && onViewBooking) {
                        onViewBooking(notification.booking_id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${notificationTypeColors[notification.notification_type] || 'bg-muted'}`}>
                        <Plane className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {notificationTypeLabels[notification.notification_type] || notification.notification_type}
                          </Badge>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm leading-tight">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.sent_at), { 
                            addSuffix: true, 
                            locale: id 
                          })}
                        </p>
                      </div>
                      {onViewBooking && notification.booking_id && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DepartureNotificationList;
