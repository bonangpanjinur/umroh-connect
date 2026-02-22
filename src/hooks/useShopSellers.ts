import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopSeller {
  id: string;
  shop_name: string;
  shop_description: string | null;
  logo_url: string | null;
  city: string | null;
  is_verified: boolean;
  rating: number;
  review_count: number;
  shipping_cost: number;
}

export const useShopSellers = (search?: string) => {
  return useQuery({
    queryKey: ['shop-sellers', search],
    queryFn: async (): Promise<ShopSeller[]> => {
      let query = supabase
        .from('seller_profiles')
        .select('id, shop_name, shop_description, logo_url, city, is_verified, rating, review_count, shipping_cost')
        .eq('is_active', true);

      if (search) {
        query = query.ilike('shop_name', `%${search}%`);
      }

      const { data, error } = await query.order('rating', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopSeller[];
    },
  });
};

// Fetch shipping costs for sellers of items in cart
export const useSellerShippingCosts = (sellerIds: string[]) => {
  return useQuery({
    queryKey: ['seller-shipping-costs', sellerIds],
    queryFn: async () => {
      if (sellerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('id, shop_name, shipping_cost')
        .in('id', sellerIds);
      if (error) throw error;
      return data || [];
    },
    enabled: sellerIds.length > 0,
  });
};
