import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Ban, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { estimateCancellation } from '@/lib/cancellationPolicy';
import {
  useCreateCancellationRequest,
  useMyCancellationRequests,
} from '@/hooks/useCancellationRequests';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

interface CancellationRequestCardProps {
  bookingId: string;
  travelId: string;
  bookingStatus: string;
  totalPrice: number;
  paidAmount: number;
  departureDate?: string | null;
}

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu peninjauan travel', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const CancellationRequestCard = ({
  bookingId,
  travelId,
  bookingStatus,
  totalPrice,
  paidAmount,
  departureDate,
}: CancellationRequestCardProps) => {
  const { data: requests, isLoading } = useMyCancellationRequests(bookingId);
  const createRequest = useCreateCancellationRequest();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const estimate = estimateCancellation(totalPrice, paidAmount, departureDate);
  const pending = (requests || []).find((r) => r.status === 'pending');
  const canRequest =
    !pending && ['pending', 'confirmed', 'paid'].includes(bookingStatus);

  const handleSubmit = async () => {
    await createRequest.mutateAsync({
      booking_id: bookingId,
      travel_id: travelId,
      reason: reason.trim(),
      penalty_percent: estimate.penaltyPercent,
      refund_estimate: estimate.refundEstimate,
    });
    setReason('');
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ban className="h-4 w-4" />
          Pembatalan Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {(requests || []).length > 0 && (
              <div className="space-y-2">
                {(requests || []).map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: idLocale })}
                      </div>
                      <Badge className={statusMeta[r.status]?.className}>
                        {statusMeta[r.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-sm">{r.reason}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Potongan {Number(r.penalty_percent)}%</span>
                      <span>Estimasi refund {formatPrice(Number(r.refund_estimate))}</span>
                    </div>
                    {r.travel_note && (
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">
                        Catatan travel: {r.travel_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canRequest ? (
              <>
                <Separator />
                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ketentuan saat ini</span>
                    <span className="font-medium text-right">{estimate.tierLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potongan</span>
                    <span className="font-medium">{estimate.penaltyPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimasi dana kembali</span>
                    <span className="font-bold text-primary">
                      {formatPrice(estimate.refundEstimate)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
                  Ajukan Pembatalan
                </Button>
              </>
            ) : pending ? (
              <p className="text-xs text-muted-foreground">
                Pengajuan Anda sedang diproses travel. Anda akan diberi tahu setelah ada keputusan.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Booking ini tidak dapat diajukan pembatalan.
              </p>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan Pembatalan</DialogTitle>
            <DialogDescription>
              Pengajuan akan ditinjau travel. Booking baru dibatalkan setelah travel menyetujui.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Potongan {estimate.penaltyPercent}% berlaku ({estimate.tierLabel}). Estimasi dana
                kembali: {formatPrice(estimate.refundEstimate)}.
              </p>
            </div>
            <Textarea
              placeholder="Tuliskan alasan pembatalan Anda"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reason.trim().length < 10 || createRequest.isPending}
            >
              {createRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kirim Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CancellationRequestCard;
