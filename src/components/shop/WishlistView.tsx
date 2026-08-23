import { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
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
      const rows = await coreApi.listCommerceWishlist();
      return rows.map((row) => ({
        id: String(row.product_id),
        category_id: row.category_id ? String(row.category_id) : null,
        seller_id: row.seller_id ? String(row.seller_id) : null,
        name: String(row.name || ''),
        slug: String(row.slug || ''),
        description: row.description ? String(row.description) : null,
        price: Number(row.price || 0),
        compare_price: row.compare_price == null ? null : Number(row.compare_price),
        stock: Number(row.stock || 0),
        weight_gram: row.weight_gram == null ? null : Number(row.weight_gram),
        thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
        images: Array.isArray(row.images) ? row.images.map(String) : [],
        is_active: Boolean(row.is_active),
        is_featured: Boolean(row.is_featured),
        created_at: String(row.product_created_at || row.created_at || ''),
        updated_at: String(row.product_updated_at || row.updated_at || ''),
        seller: row.seller_id ? { id: String(row.seller_id), shop_name: String(row.shop_name || 'Seller'), is_verified: Boolean(row.is_verified), rating: Number(row.rating || 0) } : undefined,
      }));
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
