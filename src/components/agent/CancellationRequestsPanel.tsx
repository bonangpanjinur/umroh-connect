import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Ban, Check, Clock, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  useReviewCancellationRequest,
  useTravelCancellationRequests,
} from '@/hooks/useCancellationRequests';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

interface CancellationRequestsPanelProps {
  travelId?: string;
}

const CancellationRequestsPanel = ({ travelId }: CancellationRequestsPanelProps) => {
  const { data: requests, isLoading } = useTravelCancellationRequests(travelId);
  const review = useReviewCancellationRequest();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pendingCount = (requests || []).filter((r) => r.status === 'pending').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ban className="h-4 w-4" />
          Permintaan Pembatalan
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {pendingCount} baru
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">
                  {r.booking?.booking_code || 'Booking'} · {r.booking?.contact_name || '-'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: idLocale })}
                </p>
              </div>
              <Badge className={statusMeta[r.status]?.className}>
                {statusMeta[r.status]?.label}
              </Badge>
            </div>

            <p className="text-sm">{r.reason}</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Sudah dibayar</p>
                <p className="font-medium">{formatPrice(Number(r.booking?.paid_amount || 0))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Potongan {Number(r.penalty_percent)}%</p>
                <p className="font-medium">
                  Refund {formatPrice(Number(r.refund_estimate))}
                </p>
              </div>
            </div>

            {r.status === 'pending' ? (
              <>
                <Separator />
                <Textarea
                  placeholder="Catatan untuk jemaah (opsional)"
                  value={notes[r.id] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({ id: r.id, status: 'approved', travel_note: notes[r.id] })
                    }
                  >
                    <Check className="h-4 w-4" /> Setujui & Batalkan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({ id: r.id, status: 'rejected', travel_note: notes[r.id] })
                    }
                  >
                    <X className="h-4 w-4" /> Tolak
                  </Button>
                </div>
              </>
            ) : (
              r.travel_note && (
                <p className="text-xs text-muted-foreground border-t border-border pt-2">
                  Catatan Anda: {r.travel_note}
                </p>
              )
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CancellationRequestsPanel;
