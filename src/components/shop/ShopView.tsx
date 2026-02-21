import { useState, useMemo } from 'react';
import { ArrowLeft, Search, ClipboardList, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useShopProducts, useShopCategories } from '@/hooks/useShopProducts';
import { ShopProduct } from '@/types/shop';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import CartSheet from './CartSheet';
import CheckoutView from './CheckoutView';
import OrderHistoryView from './OrderHistoryView';
import ChatNotificationBell from './ChatNotificationBell';
import OrderNotificationBell from './OrderNotificationBell';

interface ShopViewProps {
  onBack: () => void;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

const sortLabels: Record<SortOption, string> = {
  newest: 'Terbaru',
  price_asc: 'Harga Terendah',
  price_desc: 'Harga Tertinggi',
  name_asc: 'Nama A-Z',
};

const ShopView = ({ onBack }: ShopViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useShopCategories();
  const { data: products = [], isLoading } = useShopProducts(selectedCategory, search || undefined);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Price range filter
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    if (min > 0 || max < Infinity) {
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    // Featured filter
    if (featuredOnly) {
      result = result.filter((p) => p.is_featured);
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [products, sortBy, minPrice, maxPrice, featuredOnly]);

  const activeFilterCount = [minPrice, maxPrice, featuredOnly].filter(Boolean).length;

  if (showCheckout) {
    return <CheckoutView onBack={() => setShowCheckout(false)} onSuccess={() => { setShowCheckout(false); setShowOrders(true); }} />;
  }

  if (showOrders) {
    return <OrderHistoryView onBack={() => setShowOrders(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="font-bold text-lg flex-1">Oleh-oleh & Perlengkapan</h2>
          <OrderNotificationBell />
          <ChatNotificationBell />
          <Button variant="ghost" size="icon" onClick={() => setShowOrders(true)} title="Riwayat Pesanan">
            <ClipboardList className="h-5 w-5" />
          </Button>
          <CartSheet onCheckout={() => setShowCheckout(true)} />
        </div>

        {/* Search + Sort row */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="px-4 pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter Lanjutan
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Harga min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="text-sm"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="number"
                  placeholder="Harga max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={featuredOnly ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFeaturedOnly(!featuredOnly)}
                >
                  ⭐ Featured
                </Badge>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => { setMinPrice(''); setMaxPrice(''); setFeaturedOnly(false); }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada produk{search ? ` untuk "${search}"` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
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
