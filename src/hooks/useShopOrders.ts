import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ShopOrder } from '@/types/shop';
import { toast } from '@/hooks/use-toast';

interface CreateOrderInput {
  items: { productId: string; productName: string; productPrice: number; quantity: number }[];
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  notes?: string;
}

export const useShopOrders = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['shop-orders', user?.id],
    queryFn: async (): Promise<ShopOrder[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shop_orders')
        .select('*, items:shop_order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopOrder[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data: order, error: orderError } = await supabase
        .from('shop_orders')
        .insert({
          user_id: user.id,
          total_amount: input.totalAmount,
          shipping_name: input.shippingName,
          shipping_phone: input.shippingPhone,
          shipping_address: input.shippingAddress,
          shipping_city: input.shippingCity,
          shipping_postal_code: input.shippingPostalCode,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_price: item.productPrice,
        quantity: item.quantity,
        subtotal: item.productPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('shop_order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shop-cart'] });
      toast({ title: 'Pesanan berhasil dibuat!' });
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    createOrder,
  };
};
