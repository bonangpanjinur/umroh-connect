import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgentChats } from '@/hooks/useChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatListProps {
  travelId: string;
  onSelectChat: (bookingId: string | null) => void;
  bookings?: Array<{
    id: string;
    booking_code: string;
    contact_name: string;
  }>;
}

export const ChatList = ({ travelId, onSelectChat, bookings = [] }: ChatListProps) => {
  const { t, language, isRTL } = useLanguage();
  const { data: chats, isLoading } = useAgentChats(travelId);

  const locale = language === 'ar' ? ar : language === 'en' ? enUS : idLocale;

  const getBookingInfo = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
          <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-center">{t('chat.no_messages')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b shrink-0 px-4 py-3">
        <CardTitle className="text-lg">{t('chat.title')}</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {chats.map((chat) => {
            const booking = chat.booking_id ? getBookingInfo(chat.booking_id) : null;
            const timeAgo = formatDistanceToNow(new Date(chat.last_message_time), {
              addSuffix: true,
              locale,
            });

            return (
              <button
                key={chat.booking_id || 'general'}
                onClick={() => onSelectChat(chat.booking_id || null)}
                className={cn(
                  "w-full p-4 hover:bg-muted/50 transition-colors text-left",
                  isRTL && "text-right"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">
                        {booking?.contact_name || 'General Chat'}
                      </p>
                      {chat.unread_count > 0 && (
                        <Badge variant="default" className="shrink-0">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                    {booking && (
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.booking_code}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {chat.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
