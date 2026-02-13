import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminShopOrders, useUpdateShopOrderStatus } from '@/hooks/useShopAdmin';
import { ShopOrderStatus, ShopOrder } from '@/types/shop';
import { format } from 'date-fns';
import { Eye, Truck } from 'lucide-react';
import OrderDetailsDialog from '../order/OrderDetailsDialog';

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

const allStatuses: ShopOrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const courierOptions = ['JNE', 'J&T', 'SiCepat', 'Anteraja', 'Pos Indonesia', 'TIKI', 'Grab Express', 'GoSend', 'Lainnya'];

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const ShopOrdersManagement = () => {
  const { data: orders = [], isLoading } = useAdminShopOrders();
  const updateStatus = useUpdateShopOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<ShopOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');

  const handleViewDetails = (order: ShopOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleOpenTracking = (order: ShopOrder) => {
    setTrackingOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setCourier(order.courier || '');
  };

  const handleSaveTracking = () => {
    if (!trackingOrder) return;
    if (!trackingNumber.trim() || !courier.trim()) return;
    updateStatus.mutate(
      { id: trackingOrder.id, status: 'shipped', tracking_number: trackingNumber.trim(), courier: courier.trim() },
      { onSuccess: () => setTrackingOrder(null) }
    );
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Pesanan Toko</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Penerima</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Resi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.order_code}</TableCell>
                <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <div className="text-sm">{order.shipping_name || '-'}</div>
                  <div className="text-xs text-muted-foreground">{order.shipping_phone}</div>
                </TableCell>
                <TableCell className="font-medium">{formatRupiah(order.total_amount)}</TableCell>
                <TableCell>
                  {order.tracking_number ? (
                    <div className="text-xs">
                      <div className="font-medium">{order.courier}</div>
                      <div className="font-mono text-muted-foreground">{order.tracking_number}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(v) => {
                      if (v === 'shipped' && !order.tracking_number) {
                        handleOpenTracking(order);
                      } else {
                        updateStatus.mutate({ id: order.id, status: v });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <Badge className={statusColors[order.status as ShopOrderStatus] || ''}>
                        {statusLabels[order.status as ShopOrderStatus] || order.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleViewDetails(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {(order.status === 'paid' || order.status === 'processing') && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenTracking(order)} title="Input Resi">
                      <Truck className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada pesanan</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>

      <OrderDetailsDialog order={selectedOrder} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />

      {/* Tracking Input Dialog */}
      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Input Resi Pengiriman
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Pesanan: <span className="font-mono font-medium text-foreground">{trackingOrder?.order_code}</span>
            </div>
            <div>
              <Label>Kurir</Label>
              <Select value={courier} onValueChange={setCourier}>
                <SelectTrigger><SelectValue placeholder="Pilih kurir" /></SelectTrigger>
                <SelectContent>
                  {courierOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nomor Resi</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Masukkan nomor resi..."
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSaveTracking}
              disabled={!trackingNumber.trim() || !courier.trim() || updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Menyimpan...' : 'Simpan & Kirim'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShopOrdersManagement;
