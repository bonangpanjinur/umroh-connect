import { useState, useEffect } from 'react';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, GripVertical, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
  icon?: string;
  target?: '_blank' | '_self';
}

interface NavigationSettings {
  main_navigation: NavigationItem[];
}

export const NavigationManager = () => {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    url: '',
    icon: '',
    target: '_self' as '_blank' | '_self',
    is_active: true,
  });

  useEffect(() => {
    fetchNavigation();
  }, []);

  const fetchNavigation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'main_navigation')
        .maybeSingle();

      if (error) throw error;

      const valueData = data?.value as { main_navigation?: NavigationItem[] } | null;
      if (valueData?.main_navigation) {
        setItems(valueData.main_navigation);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching navigation:', err);
      toast.error('Gagal memuat navigasi');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNavigation = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'main_navigation')
        .maybeSingle();

      const navigationData = {
        main_navigation: items,
      } as any;

      if (existing) {
        await supabase
          .from('platform_settings')
          .update({ value: navigationData })
          .eq('key', 'main_navigation');
      } else {
        await supabase
          .from('platform_settings')
          .insert([{
            key: 'main_navigation',
            value: navigationData,
            description: 'Main navigation menu items',
          }] as any);
      }

      toast.success('Navigasi berhasil disimpan');
    } catch (err) {
      console.error('Error saving navigation:', err);
      toast.error('Gagal menyimpan navigasi');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      url: '',
      icon: '',
      target: '_self',
      is_active: true,
    });
    setEditingItem(null);
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      url: item.url,
      icon: item.icon || '',
      target: item.target || '_self',
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.label.trim() || !formData.url.trim()) {
      toast.error('Label dan URL harus diisi');
      return;
    }

    if (editingItem) {
      // Update existing item
      const updatedItems = items.map(item =>
        item.id === editingItem.id
          ? { ...item, ...formData }
          : item
      );
      setItems(updatedItems);
      toast.success('Item navigasi berhasil diperbarui');
    } else {
      // Add new item
      const newItem: NavigationItem = {
        id: `nav-${Date.now()}`,
        ...formData,
        order: items.length,
      };
      setItems([...items, newItem]);
      toast.success('Item navigasi berhasil ditambahkan');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      toast.success('Item navigasi berhasil dihapus');
    }
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) {
      return;
    }

    const updatedItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedItems[index], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[index]];

    // Update order
    updatedItems.forEach((item, idx) => {
      item.order = idx;
    });

    setItems(updatedItems);
  };

  const toggleActive = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, is_active: !item.is_active } : item
    );
    setItems(updatedItems);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);

    const updatedItems = [...items];
    [updatedItems[draggedIndex], updatedItems[targetIndex]] = [updatedItems[targetIndex], updatedItems[draggedIndex]];

    updatedItems.forEach((item, idx) => {
      item.order = idx;
    });

    setItems(updatedItems);
    setDraggedId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Manajemen Navigasi</h3>
          <p className="text-sm text-muted-foreground">Kelola menu navigasi utama website</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Item Navigasi' : 'Tambah Item Navigasi'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Label Menu</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Beranda"
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL / Link</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="/ atau /paket atau https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="icon">Icon (optional)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="home, package, info, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="target">Target</Label>
                  <select
                    id="target"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value as '_blank' | '_self' })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="_self">Buka di Tab Sama</option>
                    <option value="_blank">Buka di Tab Baru</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="text-sm">Aktifkan item ini</span>
                </label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSave}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={saveNavigation} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              'Simpan Navigasi'
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Item Navigasi</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada item navigasi. Tambahkan item untuk memulai.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item.id)}
                      className="group cursor-move hover:bg-muted/50"
                    >
                      <TableCell className="text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </TableCell>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">{item.url}</code>
                          {item.target === '_blank' && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleActive(item.id)}
                        >
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={idx === items.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>💡 Tips:</strong> Anda dapat menambahkan link ke halaman statis yang telah dibuat, atau link eksternal. Gunakan drag-and-drop untuk mengubah urutan menu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
