import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface ManasikGuide {
  id: string;
  title: string;
  title_arabic: string | null;
  description: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
  order_index: number;
  category: string;
  is_active: boolean;
}

export const ManasikManagement = () => {
  const [guides, setGuides] = useState<ManasikGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<ManasikGuide | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    title_arabic: '',
    description: '',
    content: '',
    image_url: '',
    video_url: '',
    category: 'both',
    is_active: true,
  });

  const fetchGuides = async () => {
    const { data, error } = await supabase
      .from('manasik_guides')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching guides:', error);
      return;
    }

    setGuides(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      title_arabic: '',
      description: '',
      content: '',
      image_url: '',
      video_url: '',
      category: 'both',
      is_active: true,
    });
    setEditingGuide(null);
  };

  const handleEdit = (guide: ManasikGuide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      title_arabic: guide.title_arabic || '',
      description: guide.description || '',
      content: guide.content,
      image_url: guide.image_url || '',
      video_url: guide.video_url || '',
      category: guide.category,
      is_active: guide.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Judul dan konten wajib diisi');
      return;
    }

    const payload = {
      title: formData.title,
      title_arabic: formData.title_arabic || null,
      description: formData.description || null,
      content: formData.content,
      image_url: formData.image_url || null,
      video_url: formData.video_url || null,
      category: formData.category,
      is_active: formData.is_active,
      order_index: editingGuide?.order_index ?? guides.length,
    };

    if (editingGuide) {
      const { error } = await supabase
        .from('manasik_guides')
        .update(payload)
        .eq('id', editingGuide.id);

      if (error) {
        toast.error('Gagal mengupdate panduan');
        return;
      }
      toast.success('Panduan berhasil diupdate');
    } else {
      const { error } = await supabase
        .from('manasik_guides')
        .insert(payload);

      if (error) {
        toast.error('Gagal menambah panduan');
        return;
      }
      toast.success('Panduan berhasil ditambahkan');
    }

    setIsDialogOpen(false);
    resetForm();
    fetchGuides();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus panduan ini?')) return;

    const { error } = await supabase
      .from('manasik_guides')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus panduan');
      return;
    }

    toast.success('Panduan berhasil dihapus');
    fetchGuides();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('manasik_guides')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast.error('Gagal mengubah status');
      return;
    }

    fetchGuides();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'umroh':
        return <Badge variant="secondary">Umroh</Badge>;
      case 'haji':
        return <Badge variant="outline">Haji</Badge>;
      default:
        return <Badge>Umroh & Haji</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Panduan Manasik</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Panduan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGuide ? 'Edit Panduan' : 'Tambah Panduan Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Judul</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Tawaf"
                  />
                </div>
                <div>
                  <Label>Judul (Arab)</Label>
                  <Input
                    value={formData.title_arabic}
                    onChange={(e) => setFormData({ ...formData, title_arabic: e.target.value })}
                    placeholder="الطواف"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <Label>Deskripsi Singkat</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ringkasan singkat panduan"
                />
              </div>

              <div>
                <Label>Konten (Markdown)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Isi panduan lengkap..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>URL Gambar</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>URL Video</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Umroh & Haji</SelectItem>
                      <SelectItem value="umroh">Umroh Saja</SelectItem>
                      <SelectItem value="haji">Haji Saja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Aktif</Label>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingGuide ? 'Update Panduan' : 'Simpan Panduan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Memuat...</p>
        ) : guides.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Belum ada panduan</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guides.map((guide, index) => (
                <TableRow key={guide.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{guide.title}</p>
                      {guide.title_arabic && (
                        <p className="text-sm text-muted-foreground" dir="rtl">
                          {guide.title_arabic}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(guide.category)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={guide.is_active}
                      onCheckedChange={(v) => handleToggleActive(guide.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(guide)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(guide.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
