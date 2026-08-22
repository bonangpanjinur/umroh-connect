import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { useAuthContext } from '@/contexts/AuthContext';

export interface TravelReview {
  id: string;
  travel_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_verified_purchase: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: { [key: number]: number };
}

export const useTravelReviews = (travelId: string | undefined) => useQuery({
  queryKey: ['travel-reviews', travelId],
  queryFn: async () => travelId ? (await coreApi.listMarketplaceReviewsByTravel(travelId) as unknown as TravelReview[]) : [],
  enabled: !!travelId,
});

export const useReviewStats = (travelId: string | undefined) => useQuery({
  queryKey: ['review-stats', travelId],
  queryFn: async (): Promise<ReviewStats> => {
    if (!travelId) return { average_rating: 0, total_reviews: 0, rating_distribution: {} };
    const ratings = await coreApi.listMarketplaceReviewsByTravel(travelId);
    const total = ratings.length;
    const sum = ratings.reduce((acc, review) => acc + Number(review.rating || 0), 0);
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((review) => { const rating = Number(review.rating); distribution[rating] = (distribution[rating] || 0) + 1; });
    return { average_rating: total ? Math.round((sum / total) * 10) / 10 : 0, total_reviews: total, rating_distribution: distribution };
  },
  enabled: !!travelId,
});

export const useUserReview = (bookingId: string | undefined) => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['user-review', bookingId, user?.id],
    queryFn: async () => bookingId ? await coreApi.getBookingReview(bookingId) as unknown as TravelReview | null : null,
    enabled: !!bookingId && !!user,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async ({ bookingId, rating, reviewText }: { bookingId: string; rating: number; reviewText?: string }) => {
      if (!user) throw new Error('Harus login untuk memberikan review');
      const existing = await coreApi.getBookingReview(bookingId);
      if (existing) return coreApi.updateBookingReview(bookingId, { rating, content: reviewText || null });
      return coreApi.createBookingReview(bookingId, { rating, content: reviewText || null });
    },
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ['user-review', variables.bookingId] }); queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] }); },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => { await coreApi.deleteBookingReview(bookingId); return { bookingId }; },
    onSuccess: ({ bookingId }) => { queryClient.invalidateQueries({ queryKey: ['user-review', bookingId] }); },
  });
};

export const useAllReviews = () => useQuery({
  queryKey: ['all-reviews'],
  queryFn: async () => (await coreApi.listManagementReviews({ limit: 100 })).data,
});

export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, isPublished }: { reviewId: string; isPublished: boolean; adminNotes?: string }) => coreApi.setManagementReviewPublication(reviewId, isPublished),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-reviews'] }); },
  });
};
