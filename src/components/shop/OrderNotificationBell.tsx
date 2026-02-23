import { Bell, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useEffect, useRef } from 'react';

const NOTIF_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==';

const OrderNotificationBell = () => {
  const { user } = useAuthContext();
  const { notifications, unreadCount, markAllRead } = useOrderNotifications();
  const { preferences } = useNotificationPreferences();
  const prevUnreadRef = useRef(unreadCount);

  // Play sound on new notification
  useEffect(() => {
    if (preferences.sound_enabled && unreadCount > prevUnreadRef.current && unreadCount > 0) {
      try {
        const audio = new Audio(NOTIF_SOUND_URL);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, preferences.sound_enabled]);

  // Filter notifications based on preferences
  const filteredNotifications = notifications.filter((n) => {
    if (n.type === 'new_order' && !preferences.notify_new_order) return false;
    if (n.type === 'status_change' && !preferences.notify_status_change) return false;
    return true;
  });

  const filteredUnread = filteredNotifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {filteredUnread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground">
              {filteredUnread > 99 ? '99+' : filteredUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifikasi Pesanan</h4>
          <div className="flex items-center gap-1">
            {preferences.sound_enabled && (
              <Volume2 className="h-3 w-3 text-muted-foreground" />
            )}
            {filteredUnread > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => markAllRead.mutate()}>
                Tandai semua dibaca
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-72">
          {filteredNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Belum ada notifikasi</p>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((n) => (
                <div key={n.id} className={`p-3 text-sm ${!n.is_read ? 'bg-primary/5' : ''}`}>
                  <p className={!n.is_read ? 'font-medium' : ''}>{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(n.created_at), 'dd/MM/yy HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default OrderNotificationBell;
