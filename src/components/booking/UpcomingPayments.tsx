import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Calendar, AlertTriangle, Check, Clock,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { useUpcomingPayments, PaymentSchedule } from '@/hooks/useBookings';

interface UpcomingPaymentsProps {
  onViewBooking?: (bookingId: string) => void;
}

const paymentTypeLabels: Record<string, string> = {
  dp: 'DP',
  installment: 'Cicilan',
  final: 'Pelunasan',
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const UpcomingPayments = ({ onViewBooking }: UpcomingPaymentsProps) => {
  const upcomingPayments = useUpcomingPayments();

  const getPaymentStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = differenceInDays(due, today);

    if (isPast(due) && !isToday(due)) {
      return {
        label: 'Terlambat',
        color: 'bg-red-500/10 text-red-600 border-red-500/20',
        icon: AlertTriangle,
        urgent: true,
      };
    }
    if (isToday(due)) {
      return {
        label: 'Hari Ini',
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        icon: Clock,
        urgent: true,
      };
    }
    if (diffDays <= 3) {
      return {
        label: `${diffDays} hari lagi`,
        color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        icon: Calendar,
        urgent: true,
      };
    }
    if (diffDays <= 7) {
      return {
        label: `${diffDays} hari lagi`,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        icon: Calendar,
        urgent: false,
      };
    }
    return {
      label: `${diffDays} hari lagi`,
      color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      icon: Calendar,
      urgent: false,
    };
  };

  if (upcomingPayments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-medium mb-1">Tidak Ada Pembayaran</h3>
          <p className="text-sm text-muted-foreground">
            Semua pembayaran Anda sudah lunas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Pembayaran Mendatang
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="p-4 pt-0 space-y-3">
            <AnimatePresence>
              {upcomingPayments.map((payment, index) => {
                const status = getPaymentStatus(payment.due_date);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`border ${status.urgent ? 'border-red-200 dark:border-red-900' : ''}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={status.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {paymentTypeLabels[payment.payment_type] || payment.payment_type}
                              </Badge>
                            </div>
                            
                            <p className="font-medium text-sm truncate">
                              {payment.packageName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.travelName} • {payment.bookingCode}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <p className="font-bold text-primary">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Jatuh tempo: {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: id })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UpcomingPayments;
