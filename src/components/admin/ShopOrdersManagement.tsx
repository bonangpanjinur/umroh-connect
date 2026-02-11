import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminShopOrders, useUpdateShopOrderStatus } from '@/hooks/useShopAdmin';
import { ShopOrderStatus } from '@/types/shop';
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

const allStatuses: ShopOrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const ShopOrdersManagement = () => {
  const { data: orders = [], isLoading } = useAdminShopOrders();
  const updateStatus = useUpdateShopOrderStatus();

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
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell>{order.items?.length || 0} item</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}
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
              </TableRow>
            ))}
            {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada pesanan</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ShopOrdersManagement;
