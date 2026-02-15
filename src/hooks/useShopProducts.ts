import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopProduct, ShopCategory } from '@/types/shop';

export const useShopCategories = () => {
  return useQuery({
    queryKey: ['shop-categories'],
    queryFn: async (): Promise<ShopCategory[]> => {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ShopCategory[];
    },
  });
};

export const useShopProducts = (categoryId?: string, search?: string) => {
  return useQuery({
    queryKey: ['shop-products', categoryId, search],
    queryFn: async (): Promise<ShopProduct[]> => {
      let query = supabase
        .from('shop_products')
        .select('*, category:shop_categories(*), seller:seller_profiles(id, shop_name, is_verified, rating)');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopProduct[];
    },
  });
};

export const useShopProduct = (productId: string) => {
  return useQuery({
    queryKey: ['shop-product', productId],
    queryFn: async (): Promise<ShopProduct | null> => {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*), seller:seller_profiles(id, shop_name, is_verified, rating)')
        .eq('id', productId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ShopProduct | null;
    },
    enabled: !!productId,
  });
};
