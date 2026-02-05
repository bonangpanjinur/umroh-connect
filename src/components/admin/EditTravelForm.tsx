import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useUpdateTravelAdmin, useAllUsers } from '@/hooks/useAdminData';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Travel } from '@/types/database';

const formSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  whatsapp: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
  verified: z.boolean().default(false),
  owner_id: z.string().optional(),
  admin_approved_slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung').optional().or(z.literal('')),
  is_custom_url_enabled_by_admin: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface EditTravelFormProps {
  travel: Travel & { owner?: { id: string; full_name: string | null } | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTravelForm = ({ travel, open, onOpenChange }: EditTravelFormProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(travel.logo_url || null);
  const updateTravel = useUpdateTravelAdmin();
  const { data: users } = useAllUsers();
  
  // Filter only agents
  const agents = users?.filter(u => u.role === 'agent') || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: travel.name || '',
      phone: travel.phone || '',
      whatsapp: travel.whatsapp || '',
      email: travel.email || '',
      address: travel.address || '',
      description: travel.description || '',
      verified: travel.verified || false,
      owner_id: travel.owner?.id || 'none',
      admin_approved_slug: travel.admin_approved_slug || '',
      is_custom_url_enabled_by_admin: travel.is_custom_url_enabled_by_admin || false,
    },
  });

  // Reset form when travel changes
  useEffect(() => {
    form.reset({
      name: travel.name || '',
      phone: travel.phone || '',
      whatsapp: travel.whatsapp || '',
      email: travel.email || '',
      address: travel.address || '',
      description: travel.description || '',
      verified: travel.verified || false,
      owner_id: travel.owner?.id || 'none',
      admin_approved_slug: travel.admin_approved_slug || '',
      is_custom_url_enabled_by_admin: travel.is_custom_url_enabled_by_admin || false,
    });
    setLogoUrl(travel.logo_url || null);
  }, [travel, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateTravel.mutateAsync({
        id: travel.id,
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        address: data.address || null,
        description: data.description || null,
        verified: data.verified,
        owner_id: data.owner_id === 'none' ? null : data.owner_id || null,
        logo_url: logoUrl,
        admin_approved_slug: data.admin_approved_slug || null,
        is_custom_url_enabled_by_admin: data.is_custom_url_enabled_by_admin,
      });
      toast.success('Travel berhasil diupdate');
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal mengupdate travel');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Travel Agency</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo Travel</label>
              <ImageUpload
                bucket="travel-logos"
                folder="logos"
                currentUrl={logoUrl}
                onUpload={setLogoUrl}
                onRemove={() => setLogoUrl(null)}
                className="w-32"
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Travel *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama travel agency" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telepon *</FormLabel>
                  <FormControl>
                    <Input placeholder="08123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="6281234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@travel.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alamat lengkap travel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi singkat tentang travel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner (Agent)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih agent (opsional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada owner</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name || agent.phone || 'Agent'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">Pengaturan URL Website</h3>
              
              <FormField
                control={form.control}
                name="is_custom_url_enabled_by_admin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 mb-4">
                    <div className="space-y-0.5">
                      <FormLabel>Aktifkan URL Kustom</FormLabel>
                      <FormDescription>
                        Izinkan travel ini menggunakan URL kustom
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admin_approved_slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug URL Disetujui</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">/</span>
                        <Input placeholder="nama-travel" {...field} disabled={!form.watch('is_custom_url_enabled_by_admin')} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      URL yang akan digunakan oleh website agen
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="verified"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Verified</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Travel ini sudah diverifikasi
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={updateTravel.isPending}>
                {updateTravel.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
