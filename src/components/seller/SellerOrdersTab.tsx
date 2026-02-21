import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Clock, MapPin, Truck, Eye } from 'lucide-react';
import { SellerOrderItem } from '@/hooks/useSellerOrders';
import { format } from 'date-fns';
import SellerOrderActionDialog from './SellerOrderActionDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const STATUS_TABS = ['all', 'paid', 'processing', 'shipped', 'delivered'] as const;

interface SellerOrdersTabProps {
  items: SellerOrderItem[];
  isLoading: boolean;
}

const SellerOrdersTab = ({ items, isLoading }: SellerOrdersTabProps) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionOrder, setActionOrder] = useState<SellerOrderItem | null>(null);
  const [detailOrder, setDetailOrder] = useState<SellerOrderItem | null>(null);

  const filtered = statusFilter === 'all'
    ? items
    : items.filter(i => i.order?.status === statusFilter);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status filter tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="w-full grid grid-cols-5 h-8">
          <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
          <TabsTrigger value="paid" className="text-xs">Dibayar</TabsTrigger>
          <TabsTrigger value="processing" className="text-xs">Proses</TabsTrigger>
          <TabsTrigger value="shipped" className="text-xs">Kirim</TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs">Selesai</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Belum ada pesanan {statusFilter !== 'all' && `berstatus "${statusLabels[statusFilter]}"`}</p>
          </CardContent>
        </Card>
      )}

      {filtered.map((item) => {
        const status = item.order?.status || 'pending';
        const canProcess = status === 'paid';
        const canShip = status === 'processing';

        return (
          <Card key={item.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{item.order?.order_code || '-'}</p>
                  <p className="font-medium text-sm">{item.product_name}</p>
                </div>
                <Badge className={`text-[10px] ${statusColors[status] || ''}`}>
                  {statusLabels[status] || status}
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.order.shipping_name} · {item.order.shipping_city || '-'}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setDetailOrder(item)}>
                  <Eye className="h-3 w-3 mr-1" /> Detail
                </Button>
                {canProcess && (
                  <Button size="sm" className="text-xs h-7" onClick={() => setActionOrder(item)}>
                    <Package className="h-3 w-3 mr-1" /> Proses
                  </Button>
                )}
                {canShip && (
                  <Button size="sm" className="text-xs h-7" onClick={() => setActionOrder(item)}>
                    <Truck className="h-3 w-3 mr-1" /> Kirim
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Action dialog */}
      {actionOrder && actionOrder.order && (
        <SellerOrderActionDialog
          open={!!actionOrder}
          onOpenChange={o => !o && setActionOrder(null)}
          orderId={actionOrder.order_id}
          orderCode={actionOrder.order.order_code}
          currentStatus={actionOrder.order.status}
        />
      )}

      {/* Detail dialog */}
      {detailOrder && detailOrder.order && (
        <Dialog open={!!detailOrder} onOpenChange={o => !o && setDetailOrder(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Detail Pesanan {detailOrder.order.order_code}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-muted-foreground">Produk</p>
                <p className="font-medium">{detailOrder.product_name} x{detailOrder.quantity}</p>
                <p className="font-semibold">{formatRupiah(detailOrder.subtotal)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Penerima</p>
                <p className="font-medium">{detailOrder.order.shipping_name || '-'}</p>
                <p>{detailOrder.order.shipping_phone || '-'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Alamat Pengiriman</p>
                <p>{detailOrder.order.shipping_address || '-'}</p>
                <p>{detailOrder.order.shipping_city || '-'}{detailOrder.order.shipping_postal_code ? ` ${detailOrder.order.shipping_postal_code}` : ''}</p>
              </div>
              {detailOrder.order.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Catatan Pembeli</p>
                    <p>{detailOrder.order.notes}</p>
                  </div>
                </>
              )}
              {detailOrder.order.payment_proof_url && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Bukti Pembayaran</p>
                    <img
                      src={detailOrder.order.payment_proof_url}
                      alt="Bukti bayar"
                      className="rounded-lg border max-h-48 object-contain cursor-pointer"
                      onClick={() => window.open(detailOrder.order!.payment_proof_url!, '_blank')}
                    />
                  </div>
                </>
              )}
              {detailOrder.order.tracking_number && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Resi Pengiriman</p>
                    <p className="font-mono">{detailOrder.order.courier ? `${detailOrder.order.courier}: ` : ''}{detailOrder.order.tracking_number}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge className={statusColors[detailOrder.order.status]}>
                  {statusLabels[detailOrder.order.status]}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SellerOrdersTab;
