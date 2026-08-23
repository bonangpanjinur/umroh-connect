import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { ShopProduct, ShopCategory } from '@/types/shop';

function mapProduct(value: Record<string, unknown>): ShopProduct {
  const seller = value.seller_id || value.shop_name ? {
    id: String(value.seller_id || ''),
    shop_name: String(value.shop_name || ''),
    is_verified: Boolean(value.is_verified ?? false),
    rating: Number(value.rating ?? 0),
  } : undefined;
  return {
    ...(value as unknown as ShopProduct),
    id: String(value.id),
    category_id: value.category_id == null ? null : String(value.category_id),
    seller_id: value.seller_id == null ? null : String(value.seller_id),
    name: String(value.name || ''),
    slug: String(value.slug || ''),
    description: value.description == null ? null : String(value.description),
    price: Number(value.price || 0),
    compare_price: value.compare_price == null ? null : Number(value.compare_price),
    stock: Number(value.stock || 0),
    weight_gram: value.weight_gram == null ? null : Number(value.weight_gram),
    thumbnail_url: value.thumbnail_url == null ? null : String(value.thumbnail_url),
    images: Array.isArray(value.images) ? value.images.map(String) : [],
    is_active: Boolean(value.is_active ?? true),
    is_featured: Boolean(value.is_featured ?? false),
    created_at: String(value.created_at || ''),
    updated_at: String(value.updated_at || ''),
    seller,
  };
}

export const useShopCategories = () => useQuery({
  queryKey: ['shop-categories', 'public'],
  queryFn: async (): Promise<ShopCategory[]> => (await coreApi.listCommerceCategories()).map((item) => item as unknown as ShopCategory),
  staleTime: 5 * 60 * 1000,
});

export const useShopProducts = (categoryId?: string, search?: string) => useQuery({
  queryKey: ['shop-products', 'public', categoryId || null, search?.trim() || null],
  queryFn: async (): Promise<ShopProduct[]> => {
    const data = await coreApi.listCommerceProducts({ categoryId, q: search?.trim() || undefined, page: 1, limit: 100 });
    return data.map(mapProduct);
  },
  staleTime: 60 * 1000,
});

export const useShopProduct = (productId: string) => useQuery({
  queryKey: ['shop-product', 'public', productId],
  queryFn: async (): Promise<ShopProduct | null> => {
    const data = await coreApi.getCommerceProduct(productId);
    return data ? mapProduct(data) : null;
  },
  enabled: !!productId,
  staleTime: 60 * 1000,
});
