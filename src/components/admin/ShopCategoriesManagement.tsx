import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useAdminShopCategories,
  useCreateShopCategory,
  useUpdateShopCategory,
  useDeleteShopCategory,
} from '@/hooks/useShopAdmin';
import { ShopCategory } from '@/types/shop';

const CategoryForm = ({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: ShopCategory;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [icon, setIcon] = useState(initial?.icon || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [sortOrder, setSortOrder] = useState(initial?.sort_order || 0);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!initial) setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  return (
    <div className="space-y-4">
      <div><Label>Nama Kategori</Label><Input value={name} onChange={(e) => handleNameChange(e.target.value)} /></div>
      <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
      <div><Label>Icon (opsional)</Label><Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. shopping-bag" /></div>
      <div><Label>Deskripsi</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div><Label>Urutan</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} /></div>
      <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Aktif</Label></div>
      <div className="flex gap-2">
        <Button onClick={() => onSubmit({ name, slug, icon: icon || null, description: description || null, sort_order: sortOrder, is_active: isActive })}>{initial ? 'Update' : 'Tambah'}</Button>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
};

const ShopCategoriesManagement = () => {
  const { data: categories = [], isLoading } = useAdminShopCategories();
  const createCategory = useCreateShopCategory();
  const updateCategory = useUpdateShopCategory();
  const deleteCategory = useDeleteShopCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopCategory | null>(null);

  const handleSubmit = (data: any) => {
    if (editing) {
      updateCategory.mutate({ id: editing.id, ...data }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    } else {
      createCategory.mutate(data, { onSuccess: () => { setDialogOpen(false); } });
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kategori Toko</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Tambah</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle></DialogHeader>
            <CategoryForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => { setDialogOpen(false); setEditing(null); }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Slug</TableHead><TableHead>Urutan</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>{cat.slug}</TableCell>
                <TableCell>{cat.sort_order}</TableCell>
                <TableCell>{cat.is_active ? '✅ Aktif' : '❌ Nonaktif'}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(cat); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm('Hapus kategori?')) deleteCategory.mutate(cat.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada kategori</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ShopCategoriesManagement;
