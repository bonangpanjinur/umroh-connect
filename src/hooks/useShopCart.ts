import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { CartItemWithProduct } from '@/types/shop';
import { toast } from '@/hooks/use-toast';

export const useShopCart = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const getOrCreateCart = async () => {
    if (!user) throw new Error('Not authenticated');
    const { data: existing } = await supabase
      .from('shop_carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('shop_carts')
      .insert({ user_id: user.id })
      .select('id')
      .single();
    if (error) throw error;
    return created.id;
  };

  const cartItemsQuery = useQuery({
    queryKey: ['shop-cart', user?.id],
    queryFn: async (): Promise<CartItemWithProduct[]> => {
      if (!user) return [];
      const { data: cart } = await supabase
        .from('shop_carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cart) return [];

      const { data, error } = await supabase
        .from('shop_cart_items')
        .select('*, product:shop_products(*)')
        .eq('cart_id', cart.id);
      if (error) throw error;
      return (data || []) as unknown as CartItemWithProduct[];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const cartId = await getOrCreateCart();
      const { data: existing } = await supabase
        .from('shop_cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('shop_cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shop_cart_items')
          .insert({ cart_id: cartId, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-cart'] });
      toast({ title: 'Ditambahkan ke keranjang' });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from('shop_cart_items').delete().eq('id', itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shop_cart_items')
          .update({ quantity })
          .eq('id', itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop-cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('shop_cart_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop-cart'] }),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { data: cart } = await supabase
        .from('shop_carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cart) return;
      const { error } = await supabase.from('shop_cart_items').delete().eq('cart_id', cart.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop-cart'] }),
  });

  const totalItems = cartItemsQuery.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPrice = cartItemsQuery.data?.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 0
  ) || 0;

  return {
    items: cartItemsQuery.data || [],
    isLoading: cartItemsQuery.isLoading,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
};
