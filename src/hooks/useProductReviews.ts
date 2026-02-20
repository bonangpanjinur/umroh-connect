import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profile?: { full_name: string | null };
}

export const useProductReviews = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<ProductReview[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, profile:profiles!product_reviews_user_id_fkey(full_name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) {
        // fallback without join if fkey name differs
        const { data: d2, error: e2 } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });
        if (e2) throw e2;
        return (d2 || []) as ProductReview[];
      }
      return (data || []) as unknown as ProductReview[];
    },
    enabled: !!productId,
  });
};

export const useProductRatingStats = (productId: string | undefined) => {
  const { data: reviews = [] } = useProductReviews(productId);
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { average: Math.round(avg * 10) / 10, count };
};

export const useCreateProductReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (params: { product_id: string; order_id: string; rating: number; review_text?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({ ...params, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', vars.product_id] });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      toast({ title: 'Review berhasil dikirim! ⭐' });
    },
    onError: (err: Error) => {
      toast({ title: 'Gagal mengirim review', description: err.message, variant: 'destructive' });
    },
  });
};
