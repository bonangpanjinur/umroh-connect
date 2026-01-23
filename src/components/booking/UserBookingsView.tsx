import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Calendar, CreditCard, ChevronRight, Clock,
  AlertTriangle, CheckCircle2, XCircle, Loader2, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUserBookings, Booking, PaymentSchedule } from '@/hooks/useBookings';
import { format, differenceInDays, isPast } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Menunggu', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  paid: { label: 'Lunas', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  completed: { label: 'Selesai', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
};

const PaymentScheduleItem = ({ schedule }: { schedule: PaymentSchedule }) => {
  const dueDate = new Date(schedule.due_date);
  const isOverdue = !schedule.is_paid && isPast(dueDate);
  const daysUntilDue = differenceInDays(dueDate, new Date());
  
  return (
    <div className={`p-3 rounded-lg border ${
      schedule.is_paid 
        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
        : isOverdue
        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        : 'bg-muted/50 border-border'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm capitalize">
            {schedule.payment_type === 'dp' ? 'Down Payment' : 
             schedule.payment_type === 'installment' ? 'Cicilan' : 'Pelunasan'}
          </p>
          <p className="text-xs text-muted-foreground">
            {schedule.is_paid ? (
              <>Dibayar: {formatDate(schedule.paid_at!)}</>
            ) : isOverdue ? (
              <span className="text-red-600 dark:text-red-400 font-medium">
                Terlambat {Math.abs(daysUntilDue)} hari!
              </span>
            ) : (
              <>Jatuh tempo: {formatDate(schedule.due_date)}</>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-bold ${schedule.is_paid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-foreground'}`}>
            {formatPrice(schedule.amount)}
          </p>
          {schedule.is_paid ? (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Lunas
            </Badge>
          ) : isOverdue ? (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
            </Badge>
          ) : daysUntilDue <= 3 ? (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
              H-{daysUntilDue}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onClick }: { booking: Booking; onClick: () => void }) => {
  const StatusIcon = statusConfig[booking.status]?.icon || Clock;
  const paidPercentage = booking.total_price > 0 
    ? Math.round((booking.paid_amount / booking.total_price) * 100)
    : 0;
  
  const hasOverdue = (booking.payment_schedules || []).some(
    s => !s.is_paid && isPast(new Date(s.due_date))
  );
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          hasOverdue ? 'border-red-300 dark:border-red-800' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-foreground">{booking.package?.name || 'Paket'}</p>
              <p className="text-xs text-muted-foreground">{booking.booking_code}</p>
            </div>
            <Badge className={statusConfig[booking.status]?.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[booking.status]?.label}
            </Badge>
          </div>
          
          {booking.departure && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Calendar className="h-3 w-3" />
              Berangkat: {formatDate(booking.departure.departure_date)}
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pembayaran</span>
              <span className="font-medium">
                {formatPrice(booking.paid_amount)} / {formatPrice(booking.total_price)}
              </span>
            </div>
            <Progress value={paidPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{paidPercentage}% terbayar</span>
              {booking.remaining_amount > 0 && (
                <span className={hasOverdue ? 'text-red-600 font-medium' : ''}>
                  Sisa: {formatPrice(booking.remaining_amount)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-3">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const UserBookingsView = () => {
  const { data: bookings, isLoading } = useUserBookings();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Package className="h-16 w-16 text-muted-foreground mx-auto" />
        <h3 className="font-semibold text-lg text-foreground">Belum Ada Booking</h3>
        <p className="text-sm text-muted-foreground">
          Anda belum memiliki booking paket umroh.<br />
          Mulai pilih paket yang sesuai di menu Paket.
        </p>
      </div>
    );
  }
  
  const selectedBookingDetails = selectedBooking;
  const whatsappUrl = selectedBookingDetails?.travel?.whatsapp 
    ? `https://wa.me/${selectedBookingDetails.travel.whatsapp.replace(/\D/g, '')}?text=Halo, saya ingin menanyakan booking ${selectedBookingDetails.booking_code}`
    : '#';
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Booking Saya</h2>
        <Badge variant="secondary">{bookings.length} booking</Badge>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <BookingCard 
                booking={booking} 
                onClick={() => setSelectedBooking(booking)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Booking Detail Sheet */}
      <Sheet open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          {selectedBookingDetails && (
            <div className="h-full overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center justify-between">
                  <span>Detail Booking</span>
                  <Badge className={statusConfig[selectedBookingDetails.status]?.color}>
                    {statusConfig[selectedBookingDetails.status]?.label}
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 pb-8">
                {/* Booking Info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kode Booking</span>
                      <span className="font-mono font-bold">{selectedBookingDetails.booking_code}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paket</span>
                      <span className="font-medium text-right">{selectedBookingDetails.package?.name}</span>
                    </div>
                    {selectedBookingDetails.travel && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Travel</span>
                        <span className="font-medium">{selectedBookingDetails.travel.name}</span>
                      </div>
                    )}
                    {selectedBookingDetails.departure && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Keberangkatan</span>
                        <span className="font-medium">
                          {formatDate(selectedBookingDetails.departure.departure_date)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah Jamaah</span>
                      <span className="font-medium">{selectedBookingDetails.number_of_pilgrims} orang</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Harga</span>
                      <span className="font-bold text-primary">
                        {formatPrice(selectedBookingDetails.total_price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Payment Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Progress Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Terbayar</span>
                      <span className="font-bold text-green-600">
                        {formatPrice(selectedBookingDetails.paid_amount)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.round((selectedBookingDetails.paid_amount / selectedBookingDetails.total_price) * 100)} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm">
                      <span>Sisa</span>
                      <span className="font-bold text-foreground">
                        {formatPrice(selectedBookingDetails.remaining_amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Payment Schedules */}
                {selectedBookingDetails.payment_schedules && selectedBookingDetails.payment_schedules.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Jadwal Pembayaran
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedBookingDetails.payment_schedules.map(schedule => (
                        <PaymentScheduleItem key={schedule.id} schedule={schedule} />
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Info Pemesan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama</span>
                      <span className="font-medium">{selectedBookingDetails.contact_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telepon</span>
                      <span className="font-medium">{selectedBookingDetails.contact_phone}</span>
                    </div>
                    {selectedBookingDetails.contact_email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{selectedBookingDetails.contact_email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {selectedBookingDetails.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Catatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedBookingDetails.notes}</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* WhatsApp Button */}
                {selectedBookingDetails.travel?.whatsapp && (
                  <Button asChild className="w-full" size="lg">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Hubungi Travel via WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UserBookingsView;
