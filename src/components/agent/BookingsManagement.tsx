import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ChevronRight, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgentBookings, usePaymentStats, Booking, BookingStatus } from '@/hooks/useBookings';
import BookingDetailModal from './BookingDetailModal';

interface BookingsManagementProps {
  travelId?: string;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'Menunggu', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: <Clock className="w-3 h-3" />
  },
  confirmed: { 
    label: 'Dikonfirmasi', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <CheckCircle2 className="w-3 h-3" />
  },
  paid: { 
    label: 'Lunas', 
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: <Wallet className="w-3 h-3" />
  },
  cancelled: { 
    label: 'Dibatalkan', 
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <XCircle className="w-3 h-3" />
  },
  completed: { 
    label: 'Selesai', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: <CheckCircle2 className="w-3 h-3" />
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const BookingsManagement = ({ travelId }: BookingsManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useAgentBookings(travelId);
  const paymentStats = usePaymentStats(travelId);

  // Filter bookings
  const filteredBookings = (bookings || []).filter(booking => {
    const matchesSearch = 
      booking.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.contact_phone.includes(searchQuery) ||
      booking.package?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate payment progress for a booking
  const getPaymentProgress = (booking: Booking) => {
    if (booking.total_price === 0) return 100;
    return Math.round((booking.paid_amount / booking.total_price) * 100);
  };

  // Get overdue payments count for a booking
  const getOverdueCount = (booking: Booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (booking.payment_schedules || []).filter(schedule => {
      if (schedule.is_paid) return false;
      const dueDate = new Date(schedule.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Booking</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{paymentStats.totalBookings}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{paymentStats.overduePayments}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Terbayar</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(paymentStats.totalPaid)}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Sisa Tagihan</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{formatCurrency(paymentStats.totalRemaining)}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode, nama, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl border-2 border-dashed border-border p-8 text-center"
        >
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium mb-1">Belum Ada Booking</h4>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'Tidak ada booking yang sesuai dengan filter' 
              : 'Booking akan muncul di sini ketika jamaah mendaftar'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking, index) => {
            const status = statusConfig[booking.status as BookingStatus] || statusConfig.pending;
            const progress = getPaymentProgress(booking);
            const overdueCount = getOverdueCount(booking);

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-float transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-primary">
                        {booking.booking_code}
                      </span>
                      <Badge variant="outline" className={status.color}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                      {overdueCount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {overdueCount} Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {booking.package?.name || 'Paket Umroh'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBookingId(booking.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detail
                  </Button>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium text-foreground">{booking.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{booking.contact_phone}</span>
                  </div>
                  {booking.departure?.departure_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(booking.departure.departure_date), 'd MMM yyyy', { locale: idLocale })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Progress */}
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Pembayaran</span>
                    <span className="text-xs font-medium">
                      {formatCurrency(booking.paid_amount)} / {formatCurrency(booking.total_price)}
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`absolute left-0 top-0 h-full rounded-full ${
                        progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-primary' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {booking.number_of_pilgrims} jamaah
                    </span>
                    <span className={`text-xs font-bold ${
                      progress >= 100 ? 'text-emerald-600' : 'text-foreground'
                    }`}>
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => window.open(`https://wa.me/${booking.contact_phone.replace(/[^0-9]/g, '')}`, '_blank')}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setSelectedBookingId(booking.id)}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Pembayaran
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBookingId && (
          <BookingDetailModal
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingsManagement;
