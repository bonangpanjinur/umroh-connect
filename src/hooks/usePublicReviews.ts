import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';

export interface PublicReview {
  id: string;
  travel_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_verified_purchase: boolean;
  is_published: boolean;
  created_at: string;
  travel?: { id: string; name: string; logo_url: string | null } | null;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface PublicReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export const usePublicReviews = () => useQuery({
  queryKey: ['public-reviews'],
  queryFn: async () => (await coreApi.listMarketplaceReviews()) as unknown as PublicReview[],
});

export const usePublicReviewStats = () => useQuery({
  queryKey: ['public-review-stats'],
  queryFn: async () => coreApi.getMarketplaceReviewStats(),
});
