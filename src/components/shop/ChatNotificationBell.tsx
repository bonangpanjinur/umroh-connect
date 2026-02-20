import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatNotificationBellProps {
  onOpenChat?: (sellerId: string) => void;
}

const ChatNotificationBell = ({ onOpenChat }: ChatNotificationBellProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useChatNotifications();

  if (unreadCount === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] p-0">
            {unreadCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Pesan Baru</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada pesan baru</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0',
                  !n.is_read && 'bg-primary/5'
                )}
                onClick={() => {
                  markAsRead(n.id);
                  onOpenChat?.(n.seller_id);
                }}
              >
                <p className="text-sm font-medium truncate">{n.sender_name || 'Pengguna'}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message_preview}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(n.created_at), 'dd/MM HH:mm')}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChatNotificationBell;
