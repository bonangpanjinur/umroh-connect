import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  User, Phone, Mail, Users, Calendar, CreditCard, 
  ArrowLeft, Check, Loader2, AlertCircle, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCreateBooking, PaymentType } from '@/hooks/useBookings';
import { PackageWithDetails, Departure } from '@/types/database';
import { useAuthContext } from '@/contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const bookingSchema = z.object({
  contactName: z.string().min(3, 'Nama minimal 3 karakter'),
  contactPhone: z.string().min(10, 'Nomor telepon tidak valid'),
  contactEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  numberOfPilgrims: z.number().min(1, 'Minimal 1 jamaah').max(10, 'Maksimal 10 jamaah'),
  notes: z.string().optional(),
  paymentOption: z.enum(['full', 'dp', 'installment']),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  package: PackageWithDetails;
  departure: Departure;
  onSuccess: () => void;
  onCancel: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'd MMMM yyyy', { locale: idLocale });
};

type PaymentOption = {
  id: 'full' | 'dp' | 'installment';
  label: string;
  description: string;
  schedules: { type: PaymentType; percentage: number; daysFromNow: number; label: string }[];
};

const paymentOptions: PaymentOption[] = [
  {
    id: 'full',
    label: 'Bayar Lunas',
    description: 'Pembayaran langsung lunas',
    schedules: [{ type: 'final', percentage: 100, daysFromNow: 7, label: 'Pelunasan' }],
  },
  {
    id: 'dp',
    label: 'DP 30%',
    description: 'DP dulu, pelunasan nanti',
    schedules: [
      { type: 'dp', percentage: 30, daysFromNow: 7, label: 'DP (30%)' },
      { type: 'final', percentage: 70, daysFromNow: 30, label: 'Pelunasan (70%)' },
    ],
  },
  {
    id: 'installment',
    label: 'Cicilan 3x',
    description: 'Bayar bertahap 3 kali',
    schedules: [
      { type: 'dp', percentage: 30, daysFromNow: 7, label: 'DP (30%)' },
      { type: 'installment', percentage: 35, daysFromNow: 30, label: 'Cicilan 1 (35%)' },
      { type: 'final', percentage: 35, daysFromNow: 60, label: 'Pelunasan (35%)' },
    ],
  },
];

const BookingForm = ({ package: pkg, departure, onSuccess, onCancel }: BookingFormProps) => {
  const { user } = useAuthContext();
  const createBooking = useCreateBooking();
  const [step, setStep] = useState<'form' | 'payment' | 'confirm'>('form');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      numberOfPilgrims: 1,
      notes: '',
      paymentOption: 'dp',
    },
  });
  
  const numberOfPilgrims = watch('numberOfPilgrims');
  const paymentOption = watch('paymentOption');
  const totalPrice = departure.price * numberOfPilgrims;
  
  const selectedPaymentOption = paymentOptions.find(p => p.id === paymentOption)!;
  
  const generatePaymentSchedules = () => {
    const today = new Date();
    return selectedPaymentOption.schedules.map(schedule => ({
      paymentType: schedule.type,
      amount: Math.round((totalPrice * schedule.percentage) / 100),
      dueDate: format(addDays(today, schedule.daysFromNow), 'yyyy-MM-dd'),
      label: schedule.label,
    }));
  };
  
  const paymentSchedules = generatePaymentSchedules();
  
  const onSubmit = async (data: BookingFormData) => {
    if (step === 'form') {
      setStep('payment');
      return;
    }
    
    if (step === 'payment') {
      setStep('confirm');
      return;
    }
    
    // Final submit
    try {
      await createBooking.mutateAsync({
        packageId: pkg.id,
        departureId: departure.id,
        travelId: pkg.travel.id,
        numberOfPilgrims: data.numberOfPilgrims,
        totalPrice,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || undefined,
        notes: data.notes || undefined,
        paymentSchedules: paymentSchedules.map(s => ({
          paymentType: s.paymentType,
          amount: s.amount,
          dueDate: s.dueDate,
        })),
      });
      onSuccess();
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleBack = () => {
    if (step === 'payment') setStep('form');
    else if (step === 'confirm') setStep('payment');
    else onCancel();
  };
  
  if (!user) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <h3 className="font-semibold text-foreground">Login Diperlukan</h3>
        <p className="text-sm text-muted-foreground">
          Silakan login terlebih dahulu untuk melakukan booking
        </p>
        <Button variant="outline" asChild>
          <a href="/auth">Masuk / Daftar</a>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="font-bold text-foreground">
            {step === 'form' && 'Data Pemesan'}
            {step === 'payment' && 'Pilih Pembayaran'}
            {step === 'confirm' && 'Konfirmasi Booking'}
          </h3>
          <p className="text-xs text-muted-foreground">
            Step {step === 'form' ? '1' : step === 'payment' ? '2' : '3'} dari 3
          </p>
        </div>
      </div>
      
      {/* Progress */}
      <div className="flex gap-1">
        {['form', 'payment', 'confirm'].map((s, i) => (
          <div 
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              ['form', 'payment', 'confirm'].indexOf(step) >= i 
                ? 'bg-primary' 
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      
      {/* Package Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm text-foreground">{pkg.name}</p>
              <p className="text-xs text-muted-foreground">{pkg.travel.name}</p>
              <p className="text-xs text-primary mt-1">
                Berangkat: {formatDate(departure.departure_date)}
              </p>
            </div>
            <Badge variant="secondary">{pkg.duration_days} Hari</Badge>
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="contactName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nama Lengkap Pemesan
              </Label>
              <Input
                id="contactName"
                placeholder="Sesuai KTP/Paspor"
                {...register('contactName')}
                className={errors.contactName ? 'border-destructive' : ''}
              />
              {errors.contactName && (
                <p className="text-xs text-destructive">{errors.contactName.message}</p>
              )}
            </div>
            
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Nomor WhatsApp
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                {...register('contactPhone')}
                className={errors.contactPhone ? 'border-destructive' : ''}
              />
              {errors.contactPhone && (
                <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email (Opsional)
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="email@contoh.com"
                {...register('contactEmail')}
                className={errors.contactEmail ? 'border-destructive' : ''}
              />
              {errors.contactEmail && (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
            
            {/* Number of Pilgrims */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Jumlah Jamaah
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setValue('numberOfPilgrims', Math.max(1, numberOfPilgrims - 1))}
                  disabled={numberOfPilgrims <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-bold text-lg">{numberOfPilgrims}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setValue('numberOfPilgrims', Math.min(10, numberOfPilgrims + 1))}
                  disabled={numberOfPilgrims >= 10 || numberOfPilgrims >= departure.available_seats}
                >
                  +
                </Button>
                <span className="text-xs text-muted-foreground">
                  (Tersedia {departure.available_seats} seat)
                </span>
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Permintaan khusus, info tambahan..."
                rows={2}
                {...register('notes')}
              />
            </div>
            
            {/* Price Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {formatPrice(departure.price)} x {numberOfPilgrims} jamaah
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full" size="lg">
              Lanjut Pilih Pembayaran
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
        
        {step === 'payment' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Pilih metode pembayaran yang sesuai:
            </p>
            
            <div className="space-y-3">
              {paymentOptions.map(option => (
                <label
                  key={option.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentOption === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.id}
                    {...register('paymentOption')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentOption === option.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentOption === option.id && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {/* Payment Schedule Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Jadwal Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentSchedules.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm text-foreground">{schedule.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Jatuh tempo: {formatDate(schedule.dueDate)}
                      </p>
                    </div>
                    <span className="font-bold text-primary">{formatPrice(schedule.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full" size="lg">
              Lanjut Konfirmasi
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
        
        {step === 'confirm' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ringkasan Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paket</span>
                  <span className="font-medium text-right">{pkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travel</span>
                  <span className="font-medium">{pkg.travel.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keberangkatan</span>
                  <span className="font-medium">{formatDate(departure.departure_date)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium">{watch('contactName')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. HP</span>
                  <span className="font-medium">{watch('contactPhone')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Jamaah</span>
                  <span className="font-medium">{numberOfPilgrims} orang</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Bayar</span>
                  <span className="font-medium">{selectedPaymentOption.label}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Schedule */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Jadwal Pembayaran Anda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentSchedules.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-primary/10 last:border-0">
                    <div>
                      <p className="font-medium text-sm text-foreground">{schedule.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Batas bayar: {formatDate(schedule.dueDate)}
                      </p>
                    </div>
                    <span className="font-bold text-primary">{formatPrice(schedule.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Penting:</strong> Setelah konfirmasi, Anda akan menerima kode booking. 
                Lakukan pembayaran sesuai jadwal untuk mengamankan seat Anda.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Konfirmasi Booking
                </>
              )}
            </Button>
          </motion.div>
        )}
      </form>
    </div>
  );
};

export default BookingForm;
