import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext as useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type FeedbackType = 'bug' | 'suggestion' | 'rating' | 'other';

export interface Feedback {
  id: string;
  user_id: string | null;
  feedback_type: FeedbackType;
  title: string;
  description: string | null;
  rating: number | null;
  category: string | null;
  screenshot_url: string | null;
  device_info: Record<string, unknown> | null;
  app_version: string | null;
  status: string;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackInput {
  feedback_type: FeedbackType;
  title: string;
  description?: string;
  rating?: number;
  category?: string;
  screenshot_url?: string;
}

export interface ContentRating {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// Get device info for bug reports
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    online: navigator.onLine,
    timestamp: new Date().toISOString(),
  };
};

export const useFeedback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's feedbacks
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Feedback[];
    },
    enabled: !!user,
  });

  // Create feedback mutation
  const createFeedback = useMutation({
    mutationFn: async (input: CreateFeedbackInput) => {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: user?.id,
          feedback_type: input.feedback_type,
          title: input.title,
          description: input.description,
          rating: input.rating,
          category: input.category,
          screenshot_url: input.screenshot_url,
          device_info: input.feedback_type === 'bug' ? getDeviceInfo() : null,
          app_version: '1.0.0', // Could be dynamic from package.json
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast({
        title: 'Feedback terkirim',
        description: 'Terima kasih atas masukan Anda!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal mengirim feedback',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    feedbacks,
    isLoading,
    createFeedback,
  };
};

export const useContentRating = (contentType: string, contentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's rating for this content
  const { data: userRating, isLoading: isLoadingUserRating } = useQuery({
    queryKey: ['content-rating', contentType, contentId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('content_ratings')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ContentRating | null;
    },
    enabled: !!user,
  });

  // Fetch average rating for this content
  const { data: averageRating, isLoading: isLoadingAverage } = useQuery({
    queryKey: ['content-rating-avg', contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_ratings')
        .select('rating')
        .eq('content_type', contentType)
        .eq('content_id', contentId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) return { average: 0, count: 0 };
      
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      return {
        average: sum / data.length,
        count: data.length,
      };
    },
  });

  // Create or update rating
  const submitRating = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      if (!user) throw new Error('Must be logged in to rate');
      
      const { data, error } = await supabase
        .from('content_ratings')
        .upsert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          rating,
          comment,
        }, {
          onConflict: 'user_id,content_type,content_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-rating', contentType, contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-rating-avg', contentType, contentId] });
      toast({
        title: 'Rating tersimpan',
        description: 'Terima kasih atas penilaian Anda!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menyimpan rating',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    userRating,
    averageRating,
    isLoading: isLoadingUserRating || isLoadingAverage,
    submitRating,
  };
};

// Admin hook for managing all feedbacks
export const useAdminFeedbacks = () => {
  const queryClient = useQueryClient();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const updateFeedback = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { data, error } = await supabase
        .from('feedbacks')
        .update({
          status,
          admin_notes,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
      toast({
        title: 'Feedback diperbarui',
      });
    },
  });

  return {
    feedbacks,
    isLoading,
    updateFeedback,
  };
};
