import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useShopChat, ShopChatMessage } from '@/hooks/useShopChat';
import { useAuthContext } from '@/contexts/AuthContext';
import { Send, MessageSquare, Check, CheckCheck, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ShopChatViewProps {
  sellerId: string;
  sellerName: string;
  orderId?: string | null;
  senderRole: 'buyer' | 'seller';
  onBack?: () => void;
}

const ShopChatView = ({ sellerId, sellerName, orderId, senderRole, onBack }: ShopChatViewProps) => {
  const { user } = useAuthContext();
  const { messages, isLoading, sendMessage, markAsRead } = useShopChat(sellerId, orderId);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [messages, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage.mutateAsync({ message: newMessage.trim(), senderRole });
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: ShopChatMessage) => {
    const isMe = msg.sender_id === user?.id;
    const time = format(new Date(msg.created_at), 'HH:mm');

    return (
      <div key={msg.id} className={cn('flex gap-2 mb-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
        {!isMe && (
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {msg.sender_role === 'seller' ? 'S' : 'B'}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2',
          isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
          <div className={cn('flex items-center gap-1 mt-0.5', isMe ? 'justify-end' : 'justify-start')}>
            <span className={cn('text-[10px]', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {time}
            </span>
            {isMe && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" /> : <Check className="h-3 w-3 text-primary-foreground/70" />)}
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
      <CardHeader className="border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {sellerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">{sellerName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {orderId ? 'Chat Pesanan' : 'Chat Toko'}
            </p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
            <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Belum ada pesan</p>
            <p className="text-xs mt-1">Mulai percakapan dengan mengetik pesan</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollArea>

      <CardContent className="border-t p-3 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ketik pesan..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending}>
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopChatView;
