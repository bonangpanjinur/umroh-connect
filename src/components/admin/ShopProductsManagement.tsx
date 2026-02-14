import { useState, useRef, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, Upload, X, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminShopProducts,
  useAdminShopCategories,
  useCreateShopProduct,
  useUpdateShopProduct,
  useDeleteShopProduct,
} from '@/hooks/useShopAdmin';
import { ShopProduct } from '@/types/shop';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const ITEMS_PER_PAGE = 10;

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ukuran file maksimal 5MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('shop-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(fileName);
      setThumbnailUrl(publicUrl);
      toast({ title: 'Gambar berhasil diupload' });
    } catch (err: any) {
      toast({ title: 'Gagal upload gambar', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      <div>
        <Label>Gambar Produk</Label>
        <div className="space-y-2">
          {thumbnailUrl && (
            <div className="relative inline-block">
              <img src={thumbnailUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border" />
              <button type="button" onClick={() => setThumbnailUrl('')} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? 'Uploading...' : 'Upload Gambar'}
            </Button>
          </div>
          <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Atau masukkan URL gambar..." className="text-xs" />
        </div>
      </div>
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

  // Filters & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category_id === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, categoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (v: string) => { setSearchQuery(v); setCurrentPage(1); };
  const handleCategoryFilter = (v: string) => { setCategoryFilter(v); setCurrentPage(1); };

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
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Produk Toko</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Tambah Produk</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle></DialogHeader>
              <ProductForm initial={editing || undefined} categories={categories} onSubmit={handleSubmit} onCancel={() => { setDialogOpen(false); setEditing(null); }} />
            </DialogContent>
          </Dialog>
        </div>
        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">{filteredProducts.length} produk</div>
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
            {paginatedProducts.map((p) => (
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
            {paginatedProducts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada produk ditemukan</TableCell></TableRow>}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopProductsManagement;
