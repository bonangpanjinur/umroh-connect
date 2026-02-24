import { useOrderStatusHistory } from '@/hooks/useOrderStatusHistory';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Package, CreditCard, Settings, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  pending: { label: 'Menunggu Bayar', icon: Clock, color: 'text-yellow-600' },
  paid: { label: 'Dibayar', icon: CreditCard, color: 'text-blue-600' },
  processing: { label: 'Diproses', icon: Settings, color: 'text-purple-600' },
  shipped: { label: 'Dikirim', icon: Truck, color: 'text-cyan-600' },
  delivered: { label: 'Selesai', icon: CheckCircle2, color: 'text-green-600' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-destructive' },
};

interface OrderStatusTimelineProps {
  orderId: string;
  createdAt: string;
}

const OrderStatusTimeline = ({ orderId, createdAt }: OrderStatusTimelineProps) => {
  const { data: history = [], isLoading } = useOrderStatusHistory(orderId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  // Build timeline: order creation + all status changes
  const entries = [
    { status: 'pending', timestamp: createdAt, isCreation: true },
    ...history.map((h) => ({ status: h.to_status, timestamp: h.created_at, isCreation: false })),
  ];

  return (
    <div className="relative pl-6 space-y-4 py-2">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-muted-foreground/20" />

      {entries.map((entry, i) => {
        const config = statusConfig[entry.status] || statusConfig.pending;
        const Icon = config.icon;
        const isLast = i === entries.length - 1;

        return (
          <div key={i} className="relative flex items-start gap-3">
            {/* Dot */}
            <div
              className={cn(
                'absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 bg-background z-10',
                isLast ? 'border-primary' : 'border-muted-foreground/30'
              )}
            >
              <Icon className={cn('h-3 w-3', isLast ? config.color : 'text-muted-foreground/60')} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', isLast ? 'text-foreground' : 'text-muted-foreground')}>
                {entry.isCreation ? 'Pesanan Dibuat' : config.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusTimeline;
