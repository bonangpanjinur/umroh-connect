import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicReview {
  id: string;
  travel_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_verified_purchase: boolean;
  is_published: boolean;
  created_at: string;
  travel?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PublicReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

// Fetch all published reviews with travel and profile info
export const usePublicReviews = () => {
  return useQuery({
    queryKey: ['public-reviews'],
    queryFn: async (): Promise<PublicReview[]> => {
      // First fetch all published reviews
      const { data: reviews, error } = await supabase
        .from('travel_reviews')
        .select(`
          id,
          travel_id,
          user_id,
          rating,
          review_text,
          is_verified_purchase,
          is_published,
          created_at
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!reviews || reviews.length === 0) return [];

      // Get unique travel IDs and user IDs
      const travelIds = [...new Set(reviews.map(r => r.travel_id))];
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      
      // Fetch travels
      const { data: travels } = await supabase
        .from('travels')
        .select('id, name, logo_url')
        .in('id', travelIds);
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      // Map travels and profiles to reviews
      const travelsMap = new Map(travels?.map(t => [t.id, t]) || []);
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return reviews.map(review => ({
        ...review,
        travel: travelsMap.get(review.travel_id) || null,
        profile: profilesMap.get(review.user_id) || null,
      }));
    },
  });
};

// Get overall stats for all published reviews
export const usePublicReviewStats = () => {
  return useQuery({
    queryKey: ['public-review-stats'],
    queryFn: async (): Promise<PublicReviewStats> => {
      const { data, error } = await supabase
        .from('travel_reviews')
        .select('rating')
        .eq('is_published', true);
      
      if (error) throw error;
      
      const ratings = data || [];
      const total = ratings.length;
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = total > 0 ? sum / total : 0;
      
      const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      });
      
      return {
        totalReviews: total,
        averageRating: Math.round(average * 10) / 10,
        ratingDistribution: distribution,
      };
    },
  });
};
