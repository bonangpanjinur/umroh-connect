import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { startOfMonth, subMonths, format, subDays } from 'date-fns';

export interface AdminReviewStats {
  totalReviews: number;
  publishedReviews: number;
  pendingReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  reviewsThisMonth: number;
  reviewsLastMonth: number;
  topRatedTravels: Array<{
    travel_id: string;
    travel_name: string;
    average_rating: number;
    total_reviews: number;
  }>;
}

export interface AdminBookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  paidBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  paidRevenue: number;
  remainingRevenue: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  topTravels: Array<{
    travel_id: string;
    travel_name: string;
    total_bookings: number;
    total_revenue: number;
  }>;
}

export interface BookingTrendData {
  date: string;
  bookings: number;
  revenue: number;
}

export interface ReviewTrendData {
  date: string;
  reviews: number;
  averageRating: number;
}

// Fetch tenant-scoped review statistics from Core
export const useAdminReviewStats = () => {
  return useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: async (): Promise<AdminReviewStats> => coreApi.getManagementReviewAnalytics(),
  });
};

// Fetch tenant-scoped booking statistics from Core
export const useAdminBookingStats = () => {
  return useQuery({
    queryKey: ['admin-booking-stats'],
    queryFn: async (): Promise<AdminBookingStats> => coreApi.getManagementBookingAnalytics(),
  });
};

// Fetch tenant-scoped booking trend data from Core
export const useBookingTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['admin-booking-trend', days],
    queryFn: async (): Promise<BookingTrendData[]> => {
      const result = await coreApi.getManagementBookingAnalytics({ days });
      return result.trend;
    },
  });
};

// Fetch tenant-scoped review trend data from Core
export const useReviewTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['admin-review-trend', days],
    queryFn: async (): Promise<ReviewTrendData[]> => {
      const result = await coreApi.getManagementReviewAnalytics({ days });
      return result.trend;
    },
  });
};
