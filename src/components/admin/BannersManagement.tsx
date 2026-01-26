import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Image, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Banner } from '@/types/database';

export const BannersManagement = () => {
  const { data: banners, isLoading } = useBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'home' as 'home' | 'paket' | 'detail',
    priority: 0,
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      position: 'home',
      priority: 0,
      is_active: true
    });
    setEditingBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      priority: banner.priority,
      is_active: banner.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast.error('Judul dan URL gambar wajib diisi');
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({
          id: editingBanner.id,
          ...formData
        });
        toast.success('Banner berhasil diupdate');
      } else {
        await createBanner.mutateAsync({
          ...formData,
          start_date: null,
          end_date: null,
          travel_id: null
        });
        toast.success('Banner berhasil ditambahkan');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Gagal menyimpan banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus banner ini?')) return;
    
    try {
      await deleteBanner.mutateAsync(id);
      toast.success('Banner berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateBanner.mutateAsync({
        id: banner.id,
        is_active: !banner.is_active
      });
      toast.success(banner.is_active ? 'Banner dinonaktifkan' : 'Banner diaktifkan');
    } catch (error) {
      toast.error('Gagal mengupdate status');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Manajemen Banner
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Banner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Judul</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Promo Ramadhan 2026"
                  />
                </div>
                
                <div>
                  <Label>URL Gambar</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                
                <div>
                  <Label>Link Tujuan (opsional)</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com/promo"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Posisi</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value: 'home' | 'paket' | 'detail') => 
                        setFormData({ ...formData, position: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="paket">Halaman Paket</SelectItem>
                        <SelectItem value="detail">Detail Paket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Prioritas</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Aktif</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                
                <Button onClick={handleSubmit} className="w-full">
                  {editingBanner ? 'Update Banner' : 'Simpan Banner'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {banners?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada banner. Klik "Tambah Banner" untuk membuat yang baru.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners?.map((banner) => (
              <Card key={banner.id} className={`overflow-hidden ${!banner.is_active ? 'opacity-50' : ''}`}>
                <div className="aspect-video relative">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {banner.position}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{banner.title}</h3>
                      {banner.link_url && (
                        <a 
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          {banner.link_url.substring(0, 30)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => handleToggleActive(banner)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(banner)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
