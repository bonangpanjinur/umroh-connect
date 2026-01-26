import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Package as PackageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from '@/types/database';
import { useCreatePackage, useUpdatePackage } from '@/hooks/useAgentData';
import { useHotels, useAirlines } from '@/hooks/useMasterData';
import MultiImageUpload from '@/components/common/MultiImageUpload';
import { useState } from 'react';

const packageSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
  duration_days: z.coerce.number().min(1, 'Minimal 1 hari').max(60, 'Maksimal 60 hari'),
  hotel_makkah: z.string().optional(),
  hotel_madinah: z.string().optional(),
  hotel_star: z.coerce.number().min(1).max(5),
  airline: z.string().optional(),
  flight_type: z.enum(['direct', 'transit']),
  meal_type: z.enum(['fullboard', 'halfboard', 'breakfast']),
  facilities: z.string().optional(),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormProps {
  travelId: string;
  package?: Package | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const PackageForm = ({ travelId, package: pkg, onClose, onSuccess }: PackageFormProps) => {
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const isEditing = !!pkg;
  
  // Load master data
  const { data: makkahHotels } = useHotels('Makkah');
  const { data: madinahHotels } = useHotels('Madinah');
  const { data: airlines } = useAirlines();
  
  // Image state
  const [images, setImages] = useState<string[]>(pkg?.images || []);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: pkg?.name || '',
      description: pkg?.description || '',
      duration_days: pkg?.duration_days || 9,
      hotel_makkah: pkg?.hotel_makkah || '',
      hotel_madinah: pkg?.hotel_madinah || '',
      hotel_star: pkg?.hotel_star || 4,
      airline: pkg?.airline || '',
      flight_type: pkg?.flight_type || 'direct',
      meal_type: pkg?.meal_type || 'fullboard',
      facilities: pkg?.facilities?.join(', ') || '',
    },
  });

  const onSubmit = async (data: PackageFormData) => {
    try {
      const packageData = {
        ...data,
        travel_id: travelId,
        hotel_makkah: data.hotel_makkah || null,
        hotel_madinah: data.hotel_madinah || null,
        airline: data.airline || null,
        facilities: data.facilities ? data.facilities.split(',').map(f => f.trim()).filter(Boolean) : [],
        images: images,
      };

      if (isEditing && pkg) {
        await updatePackage.mutateAsync({ id: pkg.id, ...packageData });
      } else {
        await createPackage.mutateAsync(packageData);
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
        className="bg-card w-full max-w-lg rounded-2xl shadow-float max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-lg">
              {isEditing ? 'Edit Paket' : 'Buat Paket Baru'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto hide-scrollbar">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Paket *</Label>
            <Input
              id="name"
              placeholder="Paket Umroh Reguler 9 Hari"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi paket umroh..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Package Images */}
          <div className="space-y-2">
            <Label>Gambar Paket</Label>
            <MultiImageUpload
              bucket="package-images"
              folder="packages"
              value={images}
              onChange={setImages}
              maxImages={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_days">Durasi (Hari) *</Label>
              <Input
                id="duration_days"
                type="number"
                min={1}
                max={60}
                {...register('duration_days')}
                className={errors.duration_days ? 'border-destructive' : ''}
              />
              {errors.duration_days && <p className="text-xs text-destructive">{errors.duration_days.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Bintang Hotel *</Label>
              <Select
                value={String(watch('hotel_star'))}
                onValueChange={(val) => setValue('hotel_star', Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">⭐⭐⭐ Bintang 3</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ Bintang 4</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ Bintang 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel_makkah">Hotel Makkah</Label>
              <Select
                value={watch('hotel_makkah') || ''}
                onValueChange={(val) => setValue('hotel_makkah', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hotel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Pilih Hotel --</SelectItem>
                  {makkahHotels?.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.name}>
                      {hotel.name} ({hotel.distance_to_haram})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel_madinah">Hotel Madinah</Label>
              <Select
                value={watch('hotel_madinah') || ''}
                onValueChange={(val) => setValue('hotel_madinah', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hotel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Pilih Hotel --</SelectItem>
                  {madinahHotels?.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.name}>
                      {hotel.name} ({hotel.distance_to_haram})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airline">Maskapai</Label>
              <Select
                value={watch('airline') || ''}
                onValueChange={(val) => setValue('airline', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih maskapai..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Pilih Maskapai --</SelectItem>
                  {airlines?.map((airline) => (
                    <SelectItem key={airline.id} value={airline.name}>
                      {airline.name} {airline.code && `(${airline.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Penerbangan *</Label>
              <Select
                value={watch('flight_type')}
                onValueChange={(val: 'direct' | 'transit') => setValue('flight_type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct (Langsung)</SelectItem>
                  <SelectItem value="transit">Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipe Makan *</Label>
            <Select
              value={watch('meal_type')}
              onValueChange={(val: 'fullboard' | 'halfboard' | 'breakfast') => setValue('meal_type', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullboard">Fullboard (3x makan)</SelectItem>
                <SelectItem value="halfboard">Halfboard (2x makan)</SelectItem>
                <SelectItem value="breakfast">Breakfast Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facilities">Fasilitas (pisahkan dengan koma)</Label>
            <Input
              id="facilities"
              placeholder="Visa, Hotel, Makan, Transport, Muthawif"
              {...register('facilities')}
            />
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

export default PackageForm;
