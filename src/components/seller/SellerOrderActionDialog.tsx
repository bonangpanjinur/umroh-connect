import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
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

const SellerOrderActionDialog = ({ open, onOpenChange, orderId, orderCode, currentStatus }: SellerOrderActionDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const nextStatus = currentStatus === 'paid' ? 'processing' : currentStatus === 'processing' ? 'shipped' : null;
  const needsTracking = currentStatus === 'processing';

  const handleSubmit = async () => {
    if (!nextStatus) return;
    if (needsTracking && (!courier || !trackingNumber.trim())) {
      toast({ title: 'Mohon isi kurir dan nomor resi', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const updateData: Record<string, unknown> = { status: nextStatus };
      if (needsTracking) {
        updateData.courier = courier;
        updateData.tracking_number = trackingNumber.trim();
      }

      const { error } = await supabase
        .from('shop_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: nextStatus === 'processing' ? 'Pesanan diproses ✅' : 'Pesanan dikirim 🚚' });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      onOpenChange(false);
      setCourier('');
      setTrackingNumber('');
    } catch (err: any) {
      toast({ title: 'Gagal update status', description: err.message, variant: 'destructive' });
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
          <p className="text-sm text-muted-foreground">
            Pesanan <strong className="font-mono">{orderCode}</strong> akan diubah statusnya
            menjadi <strong>{nextStatus === 'processing' ? 'Diproses' : 'Dikirim'}</strong>.
          </p>

          {needsTracking && (
            <>
              <div className="space-y-2">
                <Label>Kurir *</Label>
                <Select value={courier} onValueChange={setCourier}>
                  <SelectTrigger><SelectValue placeholder="Pilih kurir" /></SelectTrigger>
                  <SelectContent>
                    {COURIERS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nomor Resi *</Label>
                <Input
                  placeholder="Masukkan nomor resi"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>
            </>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Memproses...' : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {needsTracking ? 'Konfirmasi Kirim' : 'Proses Pesanan'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerOrderActionDialog;
