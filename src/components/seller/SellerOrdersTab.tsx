import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock } from 'lucide-react';
import { SellerOrderItem } from '@/hooks/useSellerOrders';
import { format } from 'date-fns';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

interface SellerOrdersTabProps {
  items: SellerOrderItem[];
  isLoading: boolean;
}

const SellerOrdersTab = ({ items, isLoading }: SellerOrdersTabProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Belum ada pesanan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground font-mono">{item.order?.order_code || '-'}</p>
                <p className="font-medium text-sm">{item.product_name}</p>
              </div>
              <Badge className={`text-[10px] ${statusColors[item.order?.status || 'pending'] || ''}`}>
                {statusLabels[item.order?.status || 'pending'] || item.order?.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{item.quantity}x {formatRupiah(item.product_price)}</span>
                <span className="font-semibold text-foreground">{formatRupiah(item.subtotal)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.order?.created_at ? format(new Date(item.order.created_at), 'dd/MM/yy') : '-'}
              </div>
            </div>
            {item.order?.shipping_name && (
              <p className="text-xs text-muted-foreground mt-1">
                👤 {item.order.shipping_name} · {item.order.shipping_city || '-'}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SellerOrdersTab;
