import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWishlist = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: wishlistIds = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('product_wishlist')
        .select('product_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map((w: any) => w.product_id);
    },
    enabled: !!user,
  });

  const toggleWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Login required');
      const isWished = wishlistIds.includes(productId);
      if (isWished) {
        const { error } = await supabase
          .from('product_wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        const { error } = await supabase
          .from('product_wishlist')
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(result.action === 'added' ? 'Ditambahkan ke favorit ❤️' : 'Dihapus dari favorit');
    },
    onError: () => toast.error('Gagal memperbarui favorit'),
  });

  const isWished = (productId: string) => wishlistIds.includes(productId);

  return { wishlistIds, isLoading, toggleWishlist, isWished };
};
