import { useState } from 'react';
import { ArrowLeft, Package, Upload, Truck, Copy, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useShopOrders } from '@/hooks/useShopOrders';
import { ShopOrder, ShopOrderStatus } from '@/types/shop';
import OrderDetailsDialog from '@/components/order/OrderDetailsDialog';
import PaymentUploadDialog from '@/components/shop/PaymentUploadDialog';
import OrderStatusStepper from '@/components/shop/OrderStatusStepper';
import ProductReviewForm from '@/components/shop/ProductReviewForm';
import ShopChatView from '@/components/shop/ShopChatView';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const lookupSeller = async (productId: string) => {
  const { data } = await supabase
    .from('shop_products')
    .select('seller_id, seller:seller_profiles!shop_products_seller_id_fkey(id, shop_name)')
    .eq('id', productId)
    .single();
  return data?.seller as { id: string; shop_name: string } | null;
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
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<ShopOrder | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<ShopOrder | null>(null);
  const [chatOrder, setChatOrder] = useState<{ sellerId: string; sellerName: string; orderId: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Enable realtime updates
  useRealtimeOrders();

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const { error } = await supabase
        .from('shop_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('status', 'pending');
      if (error) throw error;
      toast({ title: 'Pesanan berhasil dibatalkan' });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
    } catch (err: any) {
      toast({ title: 'Gagal membatalkan', description: err.message, variant: 'destructive' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const { error } = await supabase
        .from('shop_orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Pesanan dikonfirmasi diterima ✅' });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
    } catch (err: any) {
      toast({ title: 'Gagal konfirmasi', description: err.message, variant: 'destructive' });
    } finally {
      setConfirmingId(null);
    }
  };

  const copyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: 'Nomor resi disalin' });
  };

  // Show chat view if active
  if (chatOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-screen">
          <ShopChatView
            sellerId={chatOrder.sellerId}
            sellerName={chatOrder.sellerName}
            orderId={chatOrder.orderId}
            senderRole="buyer"
            onBack={() => setChatOrder(null)}
          />
        </div>
      </div>
    );
  }

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
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start cursor-pointer" onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}>
                <div>
                  <p className="font-mono text-sm font-medium">{order.order_code}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {statusLabels[order.status as ShopOrderStatus] || order.status}
                </Badge>
              </div>

              {/* Stepper */}
              <OrderStatusStepper status={order.status} />

              {/* Tracking info */}
              {order.tracking_number && (
                <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
                  <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">{order.courier || 'Kurir'}</span>
                  <span className="font-mono font-medium">{order.tracking_number}</span>
                  <button onClick={(e) => { e.stopPropagation(); copyTracking(order.tracking_number!); }} className="p-1 hover:bg-muted rounded">
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}

              {/* Amount */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{order.items?.length || 0} item</span>
                <span className="font-semibold">{formatRupiah(order.total_amount)}</span>
              </div>

              {/* Actions */}
              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); setPaymentOrder(order); }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {order.payment_proof_url ? 'Ganti Bukti' : 'Bayar'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    disabled={cancellingId === order.id}
                    onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                  >
                    {cancellingId === order.id ? '...' : 'Batalkan'}
                  </Button>
                </div>
              )}

              {order.status === 'shipped' && (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={confirmingId === order.id}
                  onClick={(e) => { e.stopPropagation(); handleConfirmDelivery(order.id); }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {confirmingId === order.id ? 'Mengkonfirmasi...' : 'Barang Diterima'}
                </Button>
              )}

              {order.status === 'delivered' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => { e.stopPropagation(); setReviewingOrder(reviewingOrder?.id === order.id ? null : order); }}
                >
                  ⭐ Beri Review
                </Button>
              )}

              {/* Chat seller button - show for non-cancelled orders */}
              {order.status !== 'cancelled' && order.status !== 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const firstItem = order.items?.[0];
                    if (firstItem?.product_id) {
                      const seller = await lookupSeller(firstItem.product_id);
                      if (seller) {
                        setChatOrder({
                          sellerId: seller.id,
                          sellerName: seller.shop_name,
                          orderId: order.id,
                        });
                      }
                    }
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Chat Penjual
                </Button>
              )}

              {/* Review forms for delivered orders */}
              {reviewingOrder?.id === order.id && order.items?.map(item => (
                <ProductReviewForm
                  key={item.id}
                  productId={item.product_id || ''}
                  orderId={order.id}
                  productName={item.product_name}
                  onDone={() => setReviewingOrder(null)}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <OrderDetailsDialog order={selectedOrder} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />

      {paymentOrder && (
        <PaymentUploadDialog
          orderId={paymentOrder.id}
          orderCode={paymentOrder.order_code}
          open={!!paymentOrder}
          onOpenChange={(open) => !open && setPaymentOrder(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['shop-orders', user?.id] });
          }}
          existingProofUrl={paymentOrder.payment_proof_url}
        />
      )}
    </div>
  );
};

export default OrderHistoryView;
