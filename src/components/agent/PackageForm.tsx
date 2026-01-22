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

const packageSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
  duration_days: z.coerce.number().min(1, 'Minimal 1 hari').max(60, 'Maksimal 60 hari'),
  hotel_makkah: z.string().max(100, 'Nama hotel maksimal 100 karakter').optional(),
  hotel_madinah: z.string().max(100, 'Nama hotel maksimal 100 karakter').optional(),
  hotel_star: z.coerce.number().min(1).max(5),
  airline: z.string().max(50, 'Nama maskapai maksimal 50 karakter').optional(),
  flight_type: z.enum(['direct', 'transit']),
  meal_type: z.enum(['fullboard', 'halfboard', 'breakfast']),
  facilities: z.string().optional(),
  images: z.string().optional(),
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
      images: pkg?.images?.join('\n') || '',
    },
  });

  const onSubmit = async (data: PackageFormData) => {
    try {
      const packageData = {
        ...data,
        travel_id: travelId,
        facilities: data.facilities ? data.facilities.split(',').map(f => f.trim()).filter(Boolean) : [],
        images: data.images ? data.images.split('\n').map(i => i.trim()).filter(Boolean) : [],
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
              <Input
                id="hotel_makkah"
                placeholder="Anjum Hotel"
                {...register('hotel_makkah')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel_madinah">Hotel Madinah</Label>
              <Input
                id="hotel_madinah"
                placeholder="Dar Al Taqwa"
                {...register('hotel_madinah')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airline">Maskapai</Label>
              <Input
                id="airline"
                placeholder="Garuda Indonesia"
                {...register('airline')}
              />
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

          <div className="space-y-2">
            <Label htmlFor="images">URL Gambar (1 per baris)</Label>
            <Textarea
              id="images"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              rows={2}
              {...register('images')}
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
