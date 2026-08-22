import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { ShopOrder } from '@/types/shop';
import { toast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/coreApi';

interface CreateOrderInput { items: { productId: string; productName: string; productPrice: number; quantity: number }[]; totalAmount: number; shippingName: string; shippingPhone: string; shippingAddress: string; shippingCity: string; shippingPostalCode: string; notes?: string; sellerId?: string | null; }

export const useShopOrders = () => {
  const { user } = useAuthContext(); const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['shop-orders', user?.id], queryFn: async (): Promise<ShopOrder[]> => user ? (await coreApi.listCommerceOrders()).map((row) => row as unknown as ShopOrder) : [], enabled: !!user });
  const createOrder = useMutation({ mutationFn: async (input: CreateOrderInput) => { if (!user) throw new Error('Not authenticated'); return coreApi.createCommerceOrder({ seller_id: input.sellerId ?? null, items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })), shipping_name: input.shippingName, shipping_phone: input.shippingPhone, shipping_address: input.shippingAddress, shipping_city: input.shippingCity, shipping_postal_code: input.shippingPostalCode, notes: input.notes || null }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shop-orders'] }); queryClient.invalidateQueries({ queryKey: ['shop-cart'] }); toast({ title: 'Pesanan berhasil dibuat!' }); } });
  return { orders: ordersQuery.data || [], isLoading: ordersQuery.isLoading, createOrder };
};
