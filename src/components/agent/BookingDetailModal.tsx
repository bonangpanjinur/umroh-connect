import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Users,
  MapPin,
  Plane,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MessageSquare,
  FileText,
  Edit2,
  Wallet,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  useBookingDetails, 
  useUpdateBookingStatus, 
  useRecordPayment,
  BookingStatus,
  PaymentSchedule 
} from '@/hooks/useBookings';

interface BookingDetailModalProps {
  bookingId: string;
  onClose: () => void;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'Menunggu', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: <Clock className="w-4 h-4" />
  },
  confirmed: { 
    label: 'Dikonfirmasi', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  paid: { 
    label: 'Lunas', 
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: <Wallet className="w-4 h-4" />
  },
  cancelled: { 
    label: 'Dibatalkan', 
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <XCircle className="w-4 h-4" />
  },
  completed: { 
    label: 'Selesai', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
};

const paymentTypeLabels: Record<string, string> = {
  dp: 'DP (Uang Muka)',
  installment: 'Cicilan',
  final: 'Pelunasan',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const BookingDetailModal = ({ bookingId, onClose }: BookingDetailModalProps) => {
  const { data: booking, isLoading } = useBookingDetails(bookingId);
  const updateStatus = useUpdateBookingStatus();
  const recordPayment = useRecordPayment();

  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus | ''>('');
  const [agentNotes, setAgentNotes] = useState('');
  
  const [paymentToRecord, setPaymentToRecord] = useState<PaymentSchedule | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    
    await updateStatus.mutateAsync({
      bookingId,
      status: newStatus,
      agentNotes: agentNotes || undefined,
    });
    
    setShowStatusEdit(false);
    setNewStatus('');
    setAgentNotes('');
  };

  const handleRecordPayment = async () => {
    if (!paymentToRecord || !paymentAmount) return;
    
    await recordPayment.mutateAsync({
      scheduleId: paymentToRecord.id,
      paidAmount: parseInt(paymentAmount),
    });
    
    setPaymentToRecord(null);
    setPaymentAmount('');
  };

  const isOverdue = (schedule: PaymentSchedule) => {
    if (schedule.is_paid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(schedule.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  if (isLoading || !booking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        onClick={onClose}
      >
        <div className="bg-card rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </motion.div>
    );
  }

  const status = statusConfig[booking.status as BookingStatus] || statusConfig.pending;
  const progress = booking.total_price > 0 
    ? Math.round((booking.paid_amount / booking.total_price) * 100) 
    : 100;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
            <div>
              <h2 className="font-bold text-lg">{booking.booking_code}</h2>
              <p className="text-xs text-muted-foreground">
                {format(new Date(booking.created_at), 'd MMMM yyyy, HH:mm', { locale: idLocale })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status & Package */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className={`${status.color} px-3 py-1`}>
                  {status.icon}
                  <span className="ml-1.5 font-medium">{status.label}</span>
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setNewStatus(booking.status as BookingStatus);
                    setAgentNotes(booking.agent_notes || '');
                    setShowStatusEdit(true);
                  }}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Ubah
                </Button>
              </div>
              
              <h3 className="font-bold text-foreground mb-1">
                {booking.package?.name || 'Paket Umroh'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {booking.number_of_pilgrims} jamaah
                </span>
                {booking.departure && (
                  <span className="flex items-center gap-1">
                    <Plane className="w-3 h-3" />
                    {format(new Date(booking.departure.departure_date), 'd MMM yyyy', { locale: idLocale })}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Kontak Jamaah
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{booking.contact_name}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${booking.contact_phone}`} className="hover:text-primary">
                    {booking.contact_phone}
                  </a>
                </div>
                {booking.contact_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${booking.contact_email}`} className="hover:text-primary">
                      {booking.contact_email}
                    </a>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => window.open(`https://wa.me/${booking.contact_phone.replace(/[^0-9]/g, '')}`, '_blank')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Hubungi via WhatsApp
              </Button>
            </div>

            {/* Payment Progress */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Pembayaran
              </h4>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-primary' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Terbayar: {formatCurrency(booking.paid_amount)}</span>
                  <span>Total: {formatCurrency(booking.total_price)}</span>
                </div>
              </div>

              {/* Payment Schedules */}
              <div className="space-y-2">
                {(booking.payment_schedules || [])
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      schedule.is_paid 
                        ? 'bg-emerald-500/10' 
                        : isOverdue(schedule) 
                          ? 'bg-destructive/10' 
                          : 'bg-secondary/50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {schedule.is_paid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : isOverdue(schedule) ? (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="font-medium text-sm">
                          {paymentTypeLabels[schedule.payment_type] || schedule.payment_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(schedule.due_date), 'd MMM yyyy', { locale: idLocale })}
                        </span>
                        {isOverdue(schedule) && !schedule.is_paid && (
                          <Badge variant="destructive" className="text-[10px] py-0">Overdue</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(schedule.amount)}</p>
                      {schedule.is_paid ? (
                        <span className="text-[10px] text-emerald-600">Lunas</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs mt-1"
                          onClick={() => {
                            setPaymentToRecord(schedule);
                            setPaymentAmount(schedule.amount.toString());
                          }}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Catat
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {(booking.notes || booking.agent_notes) && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Catatan
                </h4>
                {booking.notes && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">Dari Jamaah:</p>
                    <p className="text-sm bg-secondary/50 rounded-lg p-2">{booking.notes}</p>
                  </div>
                )}
                {booking.agent_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Catatan Agent:</p>
                    <p className="text-sm bg-primary/5 rounded-lg p-2">{booking.agent_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Status Edit Dialog */}
      <Dialog open={showStatusEdit} onOpenChange={setShowStatusEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status Baru</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as BookingStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Catatan Agent (opsional)</label>
              <Textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowStatusEdit(false)}>
                Batal
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleUpdateStatus}
                disabled={!newStatus || updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <AlertDialog open={!!paymentToRecord} onOpenChange={(open) => !open && setPaymentToRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Catat Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              {paymentToRecord && (
                <>
                  {paymentTypeLabels[paymentToRecord.payment_type]} - Jatuh tempo{' '}
                  {format(new Date(paymentToRecord.due_date), 'd MMMM yyyy', { locale: idLocale })}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Jumlah Dibayar</label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Masukkan jumlah"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tagihan: {paymentToRecord && formatCurrency(paymentToRecord.amount)}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRecordPayment}
              disabled={!paymentAmount || recordPayment.isPending}
            >
              {recordPayment.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingDetailModal;
