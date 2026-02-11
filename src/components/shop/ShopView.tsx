import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useShopProducts, useShopCategories } from '@/hooks/useShopProducts';
import { ShopProduct } from '@/types/shop';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import CartSheet from './CartSheet';
import CheckoutView from './CheckoutView';

interface ShopViewProps {
  onBack: () => void;
}

const ShopView = ({ onBack }: ShopViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: categories = [] } = useShopCategories();
  const { data: products = [], isLoading } = useShopProducts(selectedCategory, search || undefined);

  if (showCheckout) {
    return <CheckoutView onBack={() => setShowCheckout(false)} onSuccess={() => setShowCheckout(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="font-bold text-lg flex-1">Oleh-oleh & Perlengkapan</h2>
          <CartSheet onCheckout={() => setShowCheckout(true)} />
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <ScrollArea className="pb-3 px-4">
            <div className="flex gap-2">
              <Badge
                variant={!selectedCategory ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(undefined)}
              >
                Semua
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      {/* Products */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada produk{search ? ` untuk "${search}"` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
            ))}
          </div>
        )}
      </div>

      <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)} />
    </div>
  );
};

export default ShopView;
