import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: { [key: number]: number };
}

// Fetch reviews for a specific travel
export const useTravelReviews = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['travel-reviews', travelId],
    queryFn: async () => {
      if (!travelId) return [];
      
      // First fetch reviews
      const { data: reviews, error } = await supabase
        .from('travel_reviews')
        .select('*')
        .eq('travel_id', travelId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Then fetch profiles for each review
      const reviewsWithProfiles = await Promise.all(
        (reviews || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', review.user_id)
            .maybeSingle();
          
          return {
            ...review,
            profile: profile || undefined,
          } as TravelReview;
        })
      );
      
      return reviewsWithProfiles;
    },
    enabled: !!travelId,
  });
};

// Get review stats for a travel
export const useReviewStats = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['review-stats', travelId],
    queryFn: async (): Promise<ReviewStats> => {
      if (!travelId) {
        return { average_rating: 0, total_reviews: 0, rating_distribution: {} };
      }
      
      const { data, error } = await supabase
        .from('travel_reviews')
        .select('rating')
        .eq('travel_id', travelId)
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
        average_rating: Math.round(average * 10) / 10,
        total_reviews: total,
        rating_distribution: distribution,
      };
    },
    enabled: !!travelId,
  });
};

// Check if current user has reviewed a travel
export const useUserReview = (travelId: string | undefined) => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['user-review', travelId, user?.id],
    queryFn: async () => {
      if (!travelId || !user) return null;
      
      const { data, error } = await supabase
        .from('travel_reviews')
        .select('*')
        .eq('travel_id', travelId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TravelReview | null;
    },
    enabled: !!travelId && !!user,
  });
};

// Create or update review
export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  
  return useMutation({
    mutationFn: async ({ 
      travelId, 
      rating, 
      reviewText 
    }: { 
      travelId: string; 
      rating: number; 
      reviewText?: string;
    }) => {
      if (!user) throw new Error('Harus login untuk memberikan review');
      
      // Check if user already has a review
      const { data: existing } = await supabase
        .from('travel_reviews')
        .select('id')
        .eq('travel_id', travelId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Update existing review
        const { data, error } = await supabase
          .from('travel_reviews')
          .update({
            rating,
            review_text: reviewText || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('travel_reviews')
          .insert({
            travel_id: travelId,
            user_id: user.id,
            rating,
            review_text: reviewText || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['travel-reviews', variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.travelId] });
    },
  });
};

// Delete review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, travelId }: { reviewId: string; travelId: string }) => {
      const { error } = await supabase
        .from('travel_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      return { travelId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['travel-reviews', data.travelId] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', data.travelId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', data.travelId] });
    },
  });
};

// Admin: Get all reviews for moderation
export const useAllReviews = () => {
  return useQuery({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_reviews')
        .select(`
          *,
          travel:travels(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Admin: Update review status
export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      reviewId, 
      isPublished, 
      adminNotes 
    }: { 
      reviewId: string; 
      isPublished: boolean; 
      adminNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('travel_reviews')
        .update({
          is_published: isPublished,
          admin_notes: adminNotes,
        })
        .eq('id', reviewId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
    },
  });
};
