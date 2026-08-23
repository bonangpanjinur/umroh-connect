import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { CartItemWithProduct } from '@/types/shop';
import { toast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/coreApi';

export const useShopCart = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const cartKey = ['shop-cart', user?.id] as const;

  const cartItemsQuery = useQuery({
    queryKey: cartKey,
    queryFn: async (): Promise<CartItemWithProduct[]> => {
      if (!user) return [];
      return (await coreApi.getCommerceCart()) as unknown as CartItemWithProduct[];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      coreApi.addCommerceCartItem({ product_id: productId, quantity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shop-cart'] });
      toast({ title: 'Ditambahkan ke keranjang' });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      coreApi.updateCommerceCartItem(itemId, quantity),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shop-cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => coreApi.removeCommerceCartItem(itemId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shop-cart'] }),
  });

  const clearCart = useMutation({
    mutationFn: () => coreApi.clearCommerceCart(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shop-cart'] }),
  });

  const items = cartItemsQuery.data || [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return {
    items,
    isLoading: cartItemsQuery.isLoading,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
};
