import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const OrderNotificationBell = () => {
  const { user } = useAuthContext();
  const { notifications, unreadCount, markAllRead } = useOrderNotifications();

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifikasi Pesanan</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => markAllRead.mutate()}>
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Belum ada notifikasi</p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
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
