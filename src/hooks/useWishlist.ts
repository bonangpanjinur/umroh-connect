import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWishlist = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const wishlistQuery = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const rows = await coreApi.listCommerceWishlist();
      return rows.map((row) => String(row.product_id));
    },
    enabled: !!user,
  });
  const wishlistIds = wishlistQuery.data || [];
  const isLoading = wishlistQuery.isLoading;

  const toggleWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Login required');
      const isWished = wishlistIds.includes(productId);
      if (isWished) {
        await coreApi.removeCommerceWishlist(productId);
        return { action: 'removed' as const };
      }
      await coreApi.addCommerceWishlist(productId);
      return { action: 'added' as const };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-products'] });
      toast.success(result.action === 'added' ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
    },
    onError: (error: any) => toast.error(error?.message || 'Gagal memperbarui favorit'),
  });

  const isWished = (productId: string) => wishlistIds.includes(productId);

  return { wishlistIds, isLoading, toggleWishlist, isWished };
};
