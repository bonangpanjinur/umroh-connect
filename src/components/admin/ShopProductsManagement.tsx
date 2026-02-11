import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useAdminShopProducts,
  useAdminShopCategories,
  useCreateShopProduct,
  useUpdateShopProduct,
  useDeleteShopProduct,
} from '@/hooks/useShopAdmin';
import { ShopProduct } from '@/types/shop';

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const ProductForm = ({
  initial,
  categories,
  onSubmit,
  onCancel,
}: {
  initial?: ShopProduct;
  categories: { id: string; name: string }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [categoryId, setCategoryId] = useState(initial?.category_id || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price || 0);
  const [comparePrice, setComparePrice] = useState(initial?.compare_price || 0);
  const [stock, setStock] = useState(initial?.stock || 0);
  const [weightGram, setWeightGram] = useState(initial?.weight_gram || 0);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url || '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial) setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div><Label>Nama Produk</Label><Input value={name} onChange={(e) => handleNameChange(e.target.value)} /></div>
      <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
      <div>
        <Label>Kategori</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Deskripsi</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Harga (Rp)</Label><Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
        <div><Label>Harga Coret (Rp)</Label><Input type="number" value={comparePrice} onChange={(e) => setComparePrice(Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Stok</Label><Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} /></div>
        <div><Label>Berat (gram)</Label><Input type="number" value={weightGram} onChange={(e) => setWeightGram(Number(e.target.value))} /></div>
      </div>
      <div><Label>URL Thumbnail</Label><Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." /></div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Aktif</Label></div>
        <div className="flex items-center gap-2"><Switch checked={isFeatured} onCheckedChange={setIsFeatured} /><Label>Featured</Label></div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSubmit({
          name, slug, category_id: categoryId || null, description: description || null,
          price, compare_price: comparePrice || null, stock, weight_gram: weightGram || null,
          thumbnail_url: thumbnailUrl || null, is_active: isActive, is_featured: isFeatured,
        })}>{initial ? 'Update' : 'Tambah'}</Button>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
};

const ShopProductsManagement = () => {
  const { data: products = [], isLoading } = useAdminShopProducts();
  const { data: categories = [] } = useAdminShopCategories();
  const createProduct = useCreateShopProduct();
  const updateProduct = useUpdateShopProduct();
  const deleteProduct = useDeleteShopProduct();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopProduct | null>(null);

  const handleSubmit = (data: any) => {
    if (editing) {
      updateProduct.mutate({ id: editing.id, ...data }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    } else {
      createProduct.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Produk Toko</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Tambah Produk</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle></DialogHeader>
            <ProductForm initial={editing || undefined} categories={categories} onSubmit={handleSubmit} onCancel={() => { setDialogOpen(false); setEditing(null); }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {p.thumbnail_url && <img src={p.thumbnail_url} alt={p.name} className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{p.category?.name || '-'}</TableCell>
                <TableCell>
                  <div>{formatRupiah(p.price)}</div>
                  {p.compare_price && <div className="text-xs text-muted-foreground line-through">{formatRupiah(p.compare_price)}</div>}
                </TableCell>
                <TableCell><Badge variant={p.stock > 0 ? 'default' : 'destructive'}>{p.stock}</Badge></TableCell>
                <TableCell>{p.is_active ? '✅' : '❌'}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm('Hapus produk?')) deleteProduct.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada produk</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ShopProductsManagement;
