import { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopProduct } from '@/types/shop';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';

const WishlistView = () => {
  const { wishlistIds, isLoading: loadingIds } = useWishlist();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['wishlist-products', wishlistIds],
    queryFn: async (): Promise<ShopProduct[]> => {
      if (wishlistIds.length === 0) return [];
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*), seller:seller_profiles(id, shop_name, is_verified, rating)')
        .in('id', wishlistIds);
      if (error) throw error;
      return (data || []) as unknown as ShopProduct[];
    },
    enabled: wishlistIds.length > 0,
  });

  const isLoading = loadingIds || loadingProducts;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">Belum ada produk favorit</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Tap ❤️ pada produk untuk menambahkan ke favorit</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
        ))}
      </div>
      <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)} />
    </>
  );
};

export default WishlistView;
