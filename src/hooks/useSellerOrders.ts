import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SellerOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  order?: {
    id: string;
    order_code: string;
    status: string;
    total_amount: number;
    shipping_name: string | null;
    shipping_phone: string | null;
    shipping_city: string | null;
    created_at: string;
    user_id: string;
  };
}

export interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  topProducts: { name: string; count: number; revenue: number }[];
}

export const useSellerOrders = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-orders', sellerId],
    queryFn: async (): Promise<SellerOrderItem[]> => {
      if (!sellerId) return [];

      // Get all products for this seller
      const { data: products, error: pErr } = await supabase
        .from('shop_products')
        .select('id')
        .eq('seller_id', sellerId);
      if (pErr) throw pErr;

      const productIds = (products || []).map(p => p.id);
      if (productIds.length === 0) return [];

      // Get order items for those products
      const { data, error } = await supabase
        .from('shop_order_items')
        .select('*, order:shop_orders(*)')
        .in('product_id', productIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SellerOrderItem[];
    },
    enabled: !!sellerId,
  });
};

export const useSellerStats = (sellerId: string | undefined) => {
  const { data: orderItems = [], isLoading } = useSellerOrders(sellerId);

  const paidItems = orderItems.filter(
    (item) => item.order && ['paid', 'processing', 'shipped', 'delivered'].includes(item.order.status)
  );

  const totalRevenue = paidItems.reduce((sum, i) => sum + i.subtotal, 0);
  const orderIds = new Set(paidItems.map(i => i.order_id));
  const totalOrders = orderIds.size;
  const totalItemsSold = paidItems.reduce((sum, i) => sum + i.quantity, 0);

  // Top products
  const productMap = new Map<string, { name: string; count: number; revenue: number }>();
  paidItems.forEach(item => {
    const existing = productMap.get(item.product_name) || { name: item.product_name, count: 0, revenue: 0 };
    existing.count += item.quantity;
    existing.revenue += item.subtotal;
    productMap.set(item.product_name, existing);
  });
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return {
    isLoading,
    stats: { totalRevenue, totalOrders, totalItemsSold, topProducts } as SellerStats,
    allItems: orderItems,
  };
};
