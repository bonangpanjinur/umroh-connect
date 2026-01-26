import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Send, 
  MessageSquare, 
  Check, 
  CheckCheck,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale, enUS, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  bookingId: string | null;
  travelId: string;
  travelName: string;
  senderType: 'jamaah' | 'agent';
  onBack?: () => void;
}

export const ChatView = ({ 
  bookingId, 
  travelId, 
  travelName, 
  senderType,
  onBack 
}: ChatViewProps) => {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const { messages, isLoading, sendMessage, markAsRead } = useChat(bookingId, travelId);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const locale = language === 'ar' ? ar : language === 'en' ? enUS : idLocale;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead();
  }, [messages, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await sendMessage.mutateAsync({
      message: newMessage.trim(),
      senderType,
    });
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isMe = msg.sender_id === user?.id;
    const time = format(new Date(msg.created_at), 'HH:mm', { locale });

    return (
      <div
        key={msg.id}
        className={cn(
          'flex gap-2 mb-3',
          isMe ? (isRTL ? 'flex-row' : 'flex-row-reverse') : (isRTL ? 'flex-row-reverse' : 'flex-row')
        )}
      >
        {!isMe && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {msg.sender_type === 'agent' ? 'AG' : 'JM'}
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-2',
            isMe
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isMe ? 'justify-end' : 'justify-start'
            )}
          >
            <span className={cn(
              'text-[10px]',
              isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {time}
            </span>
            {isMe && (
              msg.is_read ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
              ) : (
                <Check className="h-3 w-3 text-primary-foreground/70" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className={cn("h-5 w-5", isRTL && "rotate-180")} />
            </Button>
          )}
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {travelName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{travelName}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('chat.online')}</p>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">{t('chat.no_messages')}</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollArea>

      {/* Input */}
      <CardContent className="border-t p-3 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={t('chat.placeholder')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className={cn("flex-1", isRTL && "text-right")}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className={cn("h-4 w-4", isRTL && "rotate-180")} />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
