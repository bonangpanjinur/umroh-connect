import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { useSellerChatList } from '@/hooks/useShopChat';
import ShopChatView from '@/components/shop/ShopChatView';
import { format } from 'date-fns';

interface SellerChatTabProps {
  sellerId: string;
  sellerName: string;
}

const SellerChatTab = ({ sellerId, sellerName }: SellerChatTabProps) => {
  const { data: conversations = [], isLoading } = useSellerChatList(sellerId);
  const [activeConv, setActiveConv] = useState<{ buyerId: string; orderId: string | null } | null>(null);

  if (activeConv) {
    return (
      <div className="h-[60vh]">
        <ShopChatView
          sellerId={sellerId}
          sellerName={sellerName}
          orderId={activeConv.orderId}
          senderRole="seller"
          onBack={() => setActiveConv(null)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Belum ada percakapan</p>
          <p className="text-xs mt-1">Pesan dari pembeli akan muncul di sini</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv, i) => (
        <Card
          key={i}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveConv({ buyerId: conv.buyer_id, orderId: conv.order_id })}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">
                  {conv.buyer_name}{conv.order_id ? ' · Pesanan' : ''}
                </p>
                {conv.unread > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] h-5 min-w-5 flex items-center justify-center">
                    {conv.unread}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(conv.last_time), 'dd/MM HH:mm')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SellerChatTab;
