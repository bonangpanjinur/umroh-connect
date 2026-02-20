import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'paid', label: 'Dibayar' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'delivered', label: 'Selesai' },
];

const statusIndex = (status: string) => {
  if (status === 'cancelled') return -1;
  return STEPS.findIndex(s => s.key === status);
};

interface OrderStatusStepperProps {
  status: string;
}

const OrderStatusStepper = ({ status }: OrderStatusStepperProps) => {
  const current = statusIndex(status);

  if (status === 'cancelled') {
    return (
      <div className="text-center py-2">
        <span className="text-sm text-destructive font-medium">Pesanan Dibatalkan</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-2">
      {STEPS.map((step, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {/* Line connector */}
            {i > 0 && (
              <div className={cn(
                "absolute top-3 right-1/2 w-full h-0.5 -z-10",
                isDone || isActive ? "bg-primary" : "bg-muted-foreground/20"
              )} />
            )}
            {/* Dot */}
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors",
              isDone ? "bg-primary border-primary text-primary-foreground" :
              isActive ? "bg-background border-primary text-primary" :
              "bg-background border-muted-foreground/30 text-muted-foreground/50"
            )}>
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn(
              "text-[9px] mt-1 text-center leading-tight",
              isDone || isActive ? "text-foreground font-medium" : "text-muted-foreground/60"
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;
