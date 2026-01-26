import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Travel } from '@/types/database';
import { useCreateTravel, useUpdateTravel } from '@/hooks/useAgentData';
import { ImageUpload } from '@/components/common/ImageUpload';

const travelSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  address: z.string().max(200, 'Alamat maksimal 200 karakter').optional(),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  whatsapp: z.string().max(20, 'Nomor WA maksimal 20 karakter').optional(),
  email: z.string().email('Email tidak valid').max(100).optional().or(z.literal('')),
});

type TravelFormData = z.infer<typeof travelSchema>;

interface TravelFormProps {
  travel?: Travel | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TravelForm = ({ travel, onClose, onSuccess }: TravelFormProps) => {
  const createTravel = useCreateTravel();
  const updateTravel = useUpdateTravel();
  const isEditing = !!travel;
  const [logoUrl, setLogoUrl] = useState<string | null>(travel?.logo_url || null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TravelFormData>({
    resolver: zodResolver(travelSchema),
    defaultValues: {
      name: travel?.name || '',
      description: travel?.description || '',
      address: travel?.address || '',
      phone: travel?.phone || '',
      whatsapp: travel?.whatsapp || '',
      email: travel?.email || '',
    },
  });

  const onSubmit = async (data: TravelFormData) => {
    try {
      if (isEditing && travel) {
        await updateTravel.mutateAsync({ id: travel.id, ...data, logo_url: logoUrl });
      } else {
        await createTravel.mutateAsync({ ...data, logo_url: logoUrl });
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-lg">
              {isEditing ? 'Edit Travel' : 'Buat Travel Baru'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo Travel</Label>
            <ImageUpload
              bucket="travel-logos"
              folder="logos"
              currentUrl={logoUrl}
              onUpload={setLogoUrl}
              onRemove={() => setLogoUrl(null)}
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Travel *</Label>
            <Input
              id="name"
              placeholder="PT. Travel Berkah"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi travel Anda..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              placeholder="Jl. Contoh No. 123, Jakarta"
              {...register('address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                placeholder="021-12345678"
                {...register('phone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="628123456789"
                {...register('whatsapp')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="info@travel.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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

export default TravelForm;
