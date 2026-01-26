import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface PackingTemplate {
  id: string;
  name: string;
  category: string;
  gender: string;
  is_essential: boolean;
  weather_related: boolean;
  description: string | null;
  quantity_suggestion: number;
  priority: number;
  is_active: boolean;
}

const categoryOptions = [
  { value: 'dokumen', label: '📄 Dokumen' },
  { value: 'pakaian', label: '👕 Pakaian' },
  { value: 'perlengkapan_ibadah', label: '🕌 Perlengkapan Ibadah' },
  { value: 'kesehatan', label: '💊 Kesehatan' },
  { value: 'elektronik', label: '📱 Elektronik' },
  { value: 'lainnya', label: '📦 Lainnya' },
];

const genderOptions = [
  { value: 'both', label: '👥 Semua' },
  { value: 'male', label: '👨 Pria' },
  { value: 'female', label: '👩 Wanita' },
];

export const PackingTemplatesManagement = () => {
  const [templates, setTemplates] = useState<PackingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PackingTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'pakaian',
    gender: 'both',
    is_essential: false,
    weather_related: false,
    description: '',
    quantity_suggestion: 1,
    priority: 0,
    is_active: true,
  });

  const fetchTemplates = async () => {
    let query = supabase
      .from('packing_templates')
      .select('*')
      .order('priority', { ascending: false });

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    setTemplates(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [filterCategory]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'pakaian',
      gender: 'both',
      is_essential: false,
      weather_related: false,
      description: '',
      quantity_suggestion: 1,
      priority: 0,
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: PackingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      gender: template.gender,
      is_essential: template.is_essential,
      weather_related: template.weather_related,
      description: template.description || '',
      quantity_suggestion: template.quantity_suggestion,
      priority: template.priority,
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Nama item wajib diisi');
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      gender: formData.gender,
      is_essential: formData.is_essential,
      weather_related: formData.weather_related,
      description: formData.description || null,
      quantity_suggestion: formData.quantity_suggestion,
      priority: formData.priority,
      is_active: formData.is_active,
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from('packing_templates')
        .update(payload)
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error('Gagal mengupdate template');
        return;
      }
      toast.success('Template berhasil diupdate');
    } else {
      const { error } = await supabase
        .from('packing_templates')
        .insert(payload);

      if (error) {
        toast.error('Gagal menambah template');
        return;
      }
      toast.success('Template berhasil ditambahkan');
    }

    setIsDialogOpen(false);
    resetForm();
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus template ini?')) return;

    const { error } = await supabase
      .from('packing_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus template');
      return;
    }

    toast.success('Template berhasil dihapus');
    fetchTemplates();
  };

  const getCategoryLabel = (category: string) => {
    return categoryOptions.find(c => c.value === category)?.label || category;
  };

  const getGenderLabel = (gender: string) => {
    return genderOptions.find(g => g.value === gender)?.label || gender;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Template Packing List</CardTitle>
        <div className="flex items-center gap-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categoryOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Item' : 'Tambah Item Baru'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Item</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Kain Ihram"
                  />
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
                        {categoryOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => setFormData({ ...formData, gender: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Deskripsi</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Catatan tambahan..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jumlah Saran</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity_suggestion}
                      onChange={(e) => setFormData({ ...formData, quantity_suggestion: parseInt(e.target.value) || 1 })}
                    />
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_essential}
                      onCheckedChange={(v) => setFormData({ ...formData, is_essential: v })}
                    />
                    <Label>Item Wajib/Esensial</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.weather_related}
                      onCheckedChange={(v) => setFormData({ ...formData, weather_related: v })}
                    />
                    <Label>Terkait Cuaca (tampilkan berdasarkan kondisi)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    />
                    <Label>Aktif</Label>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingTemplate ? 'Update Item' : 'Simpan Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Memuat...</p>
        ) : templates.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Belum ada template</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryLabel(template.category)}</TableCell>
                  <TableCell>{getGenderLabel(template.gender)}</TableCell>
                  <TableCell>{template.quantity_suggestion}x</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {template.is_essential && (
                        <Badge variant="destructive" className="text-xs">Wajib</Badge>
                      )}
                      {template.weather_related && (
                        <Badge variant="outline" className="text-xs">Cuaca</Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(template.id)}
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
