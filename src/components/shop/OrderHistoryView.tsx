import { useState } from 'react';
import { ArrowLeft, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useShopOrders } from '@/hooks/useShopOrders';
import { ShopOrder, ShopOrderStatus } from '@/types/shop';
import OrderDetailsDialog from '@/components/order/OrderDetailsDialog';
import { format } from 'date-fns';

const statusColors: Record<ShopOrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<ShopOrderStatus, string> = {
  pending: 'Menunggu Bayar',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface OrderHistoryViewProps {
  onBack: () => void;
}

const OrderHistoryView = ({ onBack }: OrderHistoryViewProps) => {
  const { orders, isLoading } = useShopOrders();
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">Riwayat Pesanan</h2>
      </div>

      <div className="p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada pesanan</p>
          </div>
        )}

        {orders.map((order) => (
          <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-sm font-medium">{order.order_code}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <Badge className={statusColors[order.status as ShopOrderStatus] || ''}>
                  {statusLabels[order.status as ShopOrderStatus] || order.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{order.items?.length || 0} item</span>
                <span className="font-semibold">{formatRupiah(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OrderDetailsDialog order={selectedOrder} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </div>
  );
};

export default OrderHistoryView;
