import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Departure } from '@/types/database';
import { useCreateDeparture, useUpdateDeparture } from '@/hooks/useAgentData';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const departureSchema = z.object({
  departure_date: z.date({ required_error: 'Tanggal berangkat wajib diisi' }),
  return_date: z.date({ required_error: 'Tanggal pulang wajib diisi' }),
  price: z.coerce.number().min(1000000, 'Harga minimal Rp 1.000.000'),
  original_price: z.coerce.number().optional(),
  available_seats: z.coerce.number().min(0, 'Minimal 0').max(100, 'Maksimal 100'),
  total_seats: z.coerce.number().min(1, 'Minimal 1').max(100, 'Maksimal 100'),
  status: z.enum(['available', 'limited', 'full', 'waitlist', 'cancelled']),
});

type DepartureFormData = z.infer<typeof departureSchema>;

interface DepartureFormProps {
  packageId: string;
  departure?: Departure | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const DepartureForm = ({ packageId, departure, onClose, onSuccess }: DepartureFormProps) => {
  const createDeparture = useCreateDeparture();
  const updateDeparture = useUpdateDeparture();
  const isEditing = !!departure;

  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    departure?.departure_date ? new Date(departure.departure_date) : undefined
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    departure?.return_date ? new Date(departure.return_date) : undefined
  );

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<DepartureFormData>({
    resolver: zodResolver(departureSchema),
    defaultValues: {
      departure_date: departure?.departure_date ? new Date(departure.departure_date) : undefined,
      return_date: departure?.return_date ? new Date(departure.return_date) : undefined,
      price: departure?.price || 25000000,
      original_price: departure?.original_price || undefined,
      available_seats: departure?.available_seats || 45,
      total_seats: departure?.total_seats || 45,
      status: departure?.status || 'available',
    },
  });

  const onSubmit = async (data: DepartureFormData) => {
    try {
      const departureData = {
        ...data,
        package_id: packageId,
        departure_date: format(data.departure_date, 'yyyy-MM-dd'),
        return_date: format(data.return_date, 'yyyy-MM-dd'),
        original_price: data.original_price || null,
      };

      if (isEditing && departure) {
        await updateDeparture.mutateAsync({ id: departure.id, ...departureData });
      } else {
        await createDeparture.mutateAsync(departureData);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-md rounded-2xl shadow-float max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-bold text-lg">
              {isEditing ? 'Edit Jadwal' : 'Tambah Jadwal'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto hide-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Berangkat *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !departureDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {departureDate ? format(departureDate, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={departureDate}
                    onSelect={(date) => {
                      setDepartureDate(date);
                      if (date) setValue('departure_date', date);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.departure_date && <p className="text-xs text-destructive">{errors.departure_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tanggal Pulang *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => {
                      setReturnDate(date);
                      if (date) setValue('return_date', date);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.return_date && <p className="text-xs text-destructive">{errors.return_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input
                id="price"
                type="number"
                step={100000}
                {...register('price')}
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price">Harga Coret (Opsional)</Label>
              <Input
                id="original_price"
                type="number"
                step={100000}
                placeholder="Harga sebelum diskon"
                {...register('original_price')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="available_seats">Seat Tersedia *</Label>
              <Input
                id="available_seats"
                type="number"
                min={0}
                max={100}
                {...register('available_seats')}
                className={errors.available_seats ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_seats">Total Seat *</Label>
              <Input
                id="total_seats"
                type="number"
                min={1}
                max={100}
                {...register('total_seats')}
                className={errors.total_seats ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select
              value={watch('status')}
              onValueChange={(val: Departure['status']) => setValue('status', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available (Tersedia)</SelectItem>
                <SelectItem value="limited">Limited (Terbatas)</SelectItem>
                <SelectItem value="full">Full (Penuh)</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="cancelled">Cancelled (Dibatalkan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Menyimpan...' : isEditing ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DepartureForm;
