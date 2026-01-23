import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format, startOfDay, subDays } from 'date-fns';

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

// Fetch admin review statistics
export const useAdminReviewStats = () => {
  return useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: async (): Promise<AdminReviewStats> => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = startOfMonth(now);

      // Fetch all reviews
      const { data: reviews, error } = await supabase
        .from('travel_reviews')
        .select(`
          id,
          rating,
          is_published,
          created_at,
          travel_id,
          travels(name)
        `);

      if (error) throw error;

      const allReviews = reviews || [];
      const published = allReviews.filter(r => r.is_published);
      const pending = allReviews.filter(r => !r.is_published);

      // Calculate average rating
      const totalRating = published.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = published.length > 0 ? totalRating / published.length : 0;

      // Rating distribution
      const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      published.forEach(r => {
        ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
      });

      // Monthly counts
      const reviewsThisMonth = allReviews.filter(r => 
        new Date(r.created_at) >= thisMonthStart
      ).length;

      const reviewsLastMonth = allReviews.filter(r => {
        const date = new Date(r.created_at);
        return date >= lastMonthStart && date < lastMonthEnd;
      }).length;

      // Top rated travels
      const travelStats: { [key: string]: { name: string; ratings: number[]; } } = {};
      published.forEach(r => {
        if (!travelStats[r.travel_id]) {
          travelStats[r.travel_id] = { 
            name: (r.travels as any)?.name || 'Unknown',
            ratings: [] 
          };
        }
        travelStats[r.travel_id].ratings.push(r.rating);
      });

      const topRatedTravels = Object.entries(travelStats)
        .map(([travel_id, data]) => ({
          travel_id,
          travel_name: data.name,
          average_rating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
          total_reviews: data.ratings.length,
        }))
        .filter(t => t.total_reviews >= 3) // Min 3 reviews
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 5);

      return {
        totalReviews: allReviews.length,
        publishedReviews: published.length,
        pendingReviews: pending.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        reviewsThisMonth,
        reviewsLastMonth,
        topRatedTravels,
      };
    },
  });
};

// Fetch admin booking statistics
export const useAdminBookingStats = () => {
  return useQuery({
    queryKey: ['admin-booking-stats'],
    queryFn: async (): Promise<AdminBookingStats> => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = startOfMonth(now);

      // Fetch all bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          total_price,
          paid_amount,
          remaining_amount,
          created_at,
          travel_id,
          travels(name)
        `);

      if (error) throw error;

      const allBookings = bookings || [];

      // Status counts
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        paid: 0,
        cancelled: 0,
        completed: 0,
      };

      allBookings.forEach(b => {
        if (statusCounts.hasOwnProperty(b.status)) {
          statusCounts[b.status as keyof typeof statusCounts]++;
        }
      });

      // Revenue calculations
      const activeBookings = allBookings.filter(b => b.status !== 'cancelled');
      const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const paidRevenue = activeBookings.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
      const remainingRevenue = activeBookings.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);

      // Monthly booking counts
      const bookingsThisMonth = allBookings.filter(b => 
        new Date(b.created_at) >= thisMonthStart
      ).length;

      const bookingsLastMonth = allBookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= lastMonthStart && date < lastMonthEnd;
      }).length;

      // Monthly revenue
      const revenueThisMonth = activeBookings
        .filter(b => new Date(b.created_at) >= thisMonthStart)
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      const revenueLastMonth = activeBookings
        .filter(b => {
          const date = new Date(b.created_at);
          return date >= lastMonthStart && date < lastMonthEnd;
        })
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      // Top travels by bookings
      const travelStats: { [key: string]: { name: string; bookings: number; revenue: number; } } = {};
      activeBookings.forEach(b => {
        if (!travelStats[b.travel_id]) {
          travelStats[b.travel_id] = { 
            name: (b.travels as any)?.name || 'Unknown',
            bookings: 0,
            revenue: 0 
          };
        }
        travelStats[b.travel_id].bookings++;
        travelStats[b.travel_id].revenue += b.total_price || 0;
      });

      const topTravels = Object.entries(travelStats)
        .map(([travel_id, data]) => ({
          travel_id,
          travel_name: data.name,
          total_bookings: data.bookings,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_bookings - a.total_bookings)
        .slice(0, 5);

      return {
        totalBookings: allBookings.length,
        pendingBookings: statusCounts.pending,
        confirmedBookings: statusCounts.confirmed,
        paidBookings: statusCounts.paid,
        cancelledBookings: statusCounts.cancelled,
        completedBookings: statusCounts.completed,
        totalRevenue,
        paidRevenue,
        remainingRevenue,
        bookingsThisMonth,
        bookingsLastMonth,
        revenueThisMonth,
        revenueLastMonth,
        topTravels,
      };
    },
  });
};

// Fetch booking trend data for charts
export const useBookingTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['admin-booking-trend', days],
    queryFn: async (): Promise<BookingTrendData[]> => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('created_at, total_price, status')
        .gte('created_at', startDate.toISOString())
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyData: { [key: string]: { bookings: number; revenue: number } } = {};
      
      // Initialize all days
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(endDate, days - i), 'yyyy-MM-dd');
        dailyData[date] = { bookings: 0, revenue: 0 };
      }

      // Fill in actual data
      (bookings || []).forEach(b => {
        const date = format(new Date(b.created_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].bookings++;
          dailyData[date].revenue += b.total_price || 0;
        }
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        bookings: data.bookings,
        revenue: data.revenue,
      }));
    },
  });
};

// Fetch review trend data for charts
export const useReviewTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['admin-review-trend', days],
    queryFn: async (): Promise<ReviewTrendData[]> => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const { data: reviews, error } = await supabase
        .from('travel_reviews')
        .select('created_at, rating, is_published')
        .gte('created_at', startDate.toISOString())
        .eq('is_published', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyData: { [key: string]: { reviews: number; totalRating: number } } = {};
      
      // Initialize all days
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(endDate, days - i), 'yyyy-MM-dd');
        dailyData[date] = { reviews: 0, totalRating: 0 };
      }

      // Fill in actual data
      (reviews || []).forEach(r => {
        const date = format(new Date(r.created_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].reviews++;
          dailyData[date].totalRating += r.rating;
        }
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        reviews: data.reviews,
        averageRating: data.reviews > 0 ? Math.round((data.totalRating / data.reviews) * 10) / 10 : 0,
      }));
    },
  });
};
