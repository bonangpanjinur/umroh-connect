import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';

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
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_postal_code: string | null;
    notes: string | null;
    payment_proof_url: string | null;
    tracking_number: string | null;
    courier: string | null;
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

function mapOrderItem(order: Record<string, unknown>, item: Record<string, unknown>): SellerOrderItem {
  return {
    id: String(item.id),
    order_id: String(item.order_id || order.id),
    product_id: item.product_id == null ? null : String(item.product_id),
    product_name: String(item.product_name || ''),
    product_price: Number(item.product_price || 0),
    quantity: Number(item.quantity || 0),
    subtotal: Number(item.subtotal || 0),
    created_at: String(item.created_at || order.created_at || ''),
    order: {
      id: String(order.id),
      order_code: String(order.order_code || ''),
      status: String(order.status || 'pending'),
      total_amount: Number(order.total_amount || 0),
      shipping_name: order.shipping_name == null ? null : String(order.shipping_name),
      shipping_phone: order.shipping_phone == null ? null : String(order.shipping_phone),
      shipping_address: order.shipping_address == null ? null : String(order.shipping_address),
      shipping_city: order.shipping_city == null ? null : String(order.shipping_city),
      shipping_postal_code: order.shipping_postal_code == null ? null : String(order.shipping_postal_code),
      notes: order.notes == null ? null : String(order.notes),
      payment_proof_url: order.payment_proof_url == null ? null : String(order.payment_proof_url),
      tracking_number: order.tracking_number == null ? null : String(order.tracking_number),
      courier: order.courier == null ? null : String(order.courier),
      created_at: String(order.created_at || ''),
      user_id: String(order.user_id || ''),
    },
  };
}

export const useSellerOrders = (sellerId: string | undefined) => useQuery({
  queryKey: ['seller-orders', sellerId || null],
  queryFn: async (): Promise<SellerOrderItem[]> => {
    if (!sellerId) return [];
    const orders = await coreApi.listCommerceOrders({ scope: 'seller', page: 1, limit: 100 });
    return orders.flatMap((order) => (Array.isArray(order.items) ? order.items : []).map((item) => mapOrderItem(order, item as Record<string, unknown>)));
  },
  enabled: !!sellerId,
  staleTime: 30 * 1000,
});

export const useSellerStats = (sellerId: string | undefined) => {
  const { data: orderItems = [], isLoading } = useSellerOrders(sellerId);
  const paidItems = orderItems.filter((item) => item.order && ['paid', 'processing', 'shipped', 'delivered'].includes(item.order.status));
  const totalRevenue = paidItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalOrders = new Set(paidItems.map((item) => item.order_id)).size;
  const totalItemsSold = paidItems.reduce((sum, item) => sum + item.quantity, 0);
  const productMap = new Map<string, { name: string; count: number; revenue: number }>();
  paidItems.forEach((item) => {
    const existing = productMap.get(item.product_name) || { name: item.product_name, count: 0, revenue: 0 };
    existing.count += item.quantity;
    existing.revenue += item.subtotal;
    productMap.set(item.product_name, existing);
  });
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  return { isLoading, stats: { totalRevenue, totalOrders, totalItemsSold, topProducts } as SellerStats, allItems: orderItems };
};
