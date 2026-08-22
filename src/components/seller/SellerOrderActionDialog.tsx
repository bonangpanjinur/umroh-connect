import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoreApiError, coreApi } from '@/lib/coreApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Package, Truck, CheckCircle2 } from 'lucide-react';

interface SellerOrderActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderCode: string;
  currentStatus: string;
}

const COURIERS = ['JNE', 'J&T Express', 'SiCepat', 'Anteraja', 'Ninja Express', 'POS Indonesia', 'Grab Express', 'GoSend', 'Lainnya'];

type CommerceOrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  processing: 'Diproses',
  shipped: 'Dikirim',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof CoreApiError) {
    if (error.code === 'SELLER_REQUIRED' || error.status === 403) return 'Anda tidak memiliki akses untuk mengubah pesanan ini.';
    if (error.code === 'INVALID_ORDER_TRANSITION') return 'Status pesanan sudah berubah atau transisi ini tidak diizinkan.';
    if (error.code === 'ORDER_NOT_FOUND') return 'Pesanan tidak ditemukan atau sudah tidak dapat diakses.';
    if (error.code === 'COMMAND_RATE_LIMITED' || error.status === 429) return 'Terlalu banyak permintaan. Coba lagi beberapa saat.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
}

const SellerOrderActionDialog = ({ open, onOpenChange, orderId, orderCode, currentStatus }: SellerOrderActionDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const nextStatus = useMemo<CommerceOrderStatus | null>(() => {
    if (currentStatus === 'paid') return 'processing';
    if (currentStatus === 'processing') return 'shipped';
    return null;
  }, [currentStatus]);

  const needsTracking = nextStatus === 'shipped';
  const isActionAvailable = Boolean(nextStatus);

  const handleSubmit = async () => {
    if (!nextStatus || loading) return;
    const normalizedTracking = trackingNumber.trim();
    if (needsTracking && (!courier || !normalizedTracking)) {
      toast({ title: 'Mohon isi kurir dan nomor resi', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      await coreApi.updateCommerceOrderStatus(orderId, {
        status: nextStatus,
        ...(needsTracking ? { courier, tracking_number: normalizedTracking } : {}),
      }, idempotencyKey);

      toast({ title: nextStatus === 'processing' ? 'Pesanan diproses' : 'Pesanan dikirim' });
      await queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['commerce-orders'] });
      onOpenChange(false);
      setCourier('');
      setTrackingNumber('');
    } catch (error) {
      toast({ title: 'Gagal memperbarui status', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {needsTracking ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            {needsTracking ? 'Kirim Pesanan' : 'Proses Pesanan'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isActionAvailable ? (
            <p className="text-sm text-muted-foreground">Pesanan <strong className="font-mono">{orderCode}</strong> tidak memiliki tindakan yang tersedia dari status <strong>{currentStatus}</strong>.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Pesanan <strong className="font-mono">{orderCode}</strong> akan diubah statusnya menjadi <strong>{STATUS_LABELS[nextStatus!]}</strong>.
              </p>

              {needsTracking && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="seller-order-courier">Kurir *</Label>
                    <Select value={courier} onValueChange={setCourier}>
                      <SelectTrigger id="seller-order-courier"><SelectValue placeholder="Pilih kurir" /></SelectTrigger>
                      <SelectContent>
                        {COURIERS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-order-tracking">Nomor Resi *</Label>
                    <Input id="seller-order-tracking" placeholder="Masukkan nomor resi" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} maxLength={120} />
                  </div>
                </>
              )}

              <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Memproses...' : <><CheckCircle2 className="h-4 w-4 mr-2" />{needsTracking ? 'Konfirmasi Kirim' : 'Proses Pesanan'}</>}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerOrderActionDialog;
