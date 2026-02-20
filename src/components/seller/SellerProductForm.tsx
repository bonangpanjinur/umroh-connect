import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useShopCategories } from '@/hooks/useShopProducts';
import { useUpsertSellerProduct } from '@/hooks/useSeller';
import { ShopProduct } from '@/types/shop';
import { ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/common/ImageUpload';

interface SellerProductFormProps {
  sellerId: string;
  product?: ShopProduct | null;
  onBack: () => void;
}

const SellerProductForm = ({ sellerId, product, onBack }: SellerProductFormProps) => {
  const { data: categories = [] } = useShopCategories();
  const upsertMutation = useUpsertSellerProduct();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    compare_price: null as number | null,
    stock: 0,
    weight_gram: null as number | null,
    category_id: null as string | null,
    thumbnail_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        compare_price: product.compare_price,
        stock: product.stock,
        weight_gram: product.weight_gram,
        category_id: product.category_id,
        thumbnail_url: product.thumbnail_url || '',
        is_active: product.is_active,
      });
    }
  }, [product]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || generateSlug(form.name);
    upsertMutation.mutate(
      {
        ...(product?.id ? { id: product.id } : {}),
        seller_id: sellerId,
        name: form.name,
        slug,
        description: form.description || undefined,
        price: form.price,
        compare_price: form.compare_price,
        stock: form.stock,
        weight_gram: form.weight_gram,
        category_id: form.category_id,
        thumbnail_url: form.thumbnail_url || null,
        is_active: form.is_active,
      },
      { onSuccess: () => onBack() }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{product ? 'Edit Produk' : 'Tambah Produk'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Produk *</Label>
            <Input
              required
              value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, slug: generateSlug(name) }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={form.category_id || ''} onValueChange={v => setForm(f => ({ ...f, category_id: v || null }))}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Harga *</Label>
              <Input type="number" required min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Harga Coret</Label>
              <Input type="number" min={0} value={form.compare_price || ''} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value ? Number(e.target.value) : null }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Stok *</Label>
              <Input type="number" required min={0} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Berat (gram)</Label>
              <Input type="number" min={0} value={form.weight_gram || ''} onChange={e => setForm(f => ({ ...f, weight_gram: e.target.value ? Number(e.target.value) : null }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gambar Produk</Label>
            <ImageUpload
              bucket="shop-images"
              folder="products"
              currentUrl={form.thumbnail_url || null}
              onUpload={(url) => setForm(f => ({ ...f, thumbnail_url: url }))}
              onRemove={() => setForm(f => ({ ...f, thumbnail_url: '' }))}
              aspectRatio="square"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Aktifkan Produk</Label>
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
          </div>

          <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SellerProductForm;
