import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  useAdminReviewStats,
  useAdminBookingStats,
  useBookingTrend,
  useReviewTrend,
} from '@/hooks/useAdminAnalytics';
import { useAdminStats } from '@/hooks/useAdminData';
import {
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  ShoppingCart,
  DollarSign,
  Users,
  Building2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}K`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const formatFullCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard = ({ title, value, description, icon: Icon, trend, trendLabel, variant = 'default' }: StatCardProps) => {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    danger: 'bg-red-500/10 border-red-500/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <Badge 
                variant={trend >= 0 ? 'default' : 'destructive'} 
                className="text-xs"
              >
                {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trend >= 0 ? '+' : ''}{trend}%
              </Badge>
            )}
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
            {description && !trend && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const STATUS_COLORS = {
  pending: 'hsl(45, 93%, 47%)',
  confirmed: 'hsl(221, 83%, 53%)',
  paid: 'hsl(142, 76%, 36%)',
  cancelled: 'hsl(0, 84%, 60%)',
  completed: 'hsl(262, 83%, 58%)',
};

export const AdminAnalyticsDashboard = () => {
  const { data: platformStats, isLoading: loadingPlatform } = useAdminStats();
  const { data: reviewStats, isLoading: loadingReviews } = useAdminReviewStats();
  const { data: bookingStats, isLoading: loadingBookings } = useAdminBookingStats();
  const { data: bookingTrend } = useBookingTrend(30);
  const { data: reviewTrend } = useReviewTrend(30);

  const isLoading = loadingPlatform || loadingReviews || loadingBookings;

  // Calculate trends
  const bookingTrendPercent = useMemo(() => {
    if (!bookingStats || bookingStats.bookingsLastMonth === 0) return 0;
    return Math.round(
      ((bookingStats.bookingsThisMonth - bookingStats.bookingsLastMonth) / bookingStats.bookingsLastMonth) * 100
    );
  }, [bookingStats]);

  const revenueTrendPercent = useMemo(() => {
    if (!bookingStats || bookingStats.revenueLastMonth === 0) return 0;
    return Math.round(
      ((bookingStats.revenueThisMonth - bookingStats.revenueLastMonth) / bookingStats.revenueLastMonth) * 100
    );
  }, [bookingStats]);

  const reviewTrendPercent = useMemo(() => {
    if (!reviewStats || reviewStats.reviewsLastMonth === 0) return 0;
    return Math.round(
      ((reviewStats.reviewsThisMonth - reviewStats.reviewsLastMonth) / reviewStats.reviewsLastMonth) * 100
    );
  }, [reviewStats]);

  // Booking status pie chart data
  const bookingStatusData = useMemo(() => {
    if (!bookingStats) return [];
    return [
      { name: 'Pending', value: bookingStats.pendingBookings, color: STATUS_COLORS.pending },
      { name: 'Confirmed', value: bookingStats.confirmedBookings, color: STATUS_COLORS.confirmed },
      { name: 'Paid', value: bookingStats.paidBookings, color: STATUS_COLORS.paid },
      { name: 'Completed', value: bookingStats.completedBookings, color: STATUS_COLORS.completed },
      { name: 'Cancelled', value: bookingStats.cancelledBookings, color: STATUS_COLORS.cancelled },
    ].filter(item => item.value > 0);
  }, [bookingStats]);

  // Rating distribution bar chart data
  const ratingDistributionData = useMemo(() => {
    if (!reviewStats) return [];
    return [5, 4, 3, 2, 1].map(rating => ({
      rating: `${rating} ⭐`,
      count: reviewStats.ratingDistribution[rating] || 0,
    }));
  }, [reviewStats]);

  // Chart configs
  const bookingChartConfig: ChartConfig = {
    bookings: { label: 'Booking', color: 'hsl(var(--primary))' },
    revenue: { label: 'Revenue', color: 'hsl(var(--chart-2))' },
  };

  const reviewChartConfig: ChartConfig = {
    reviews: { label: 'Review', color: 'hsl(var(--chart-3))' },
    averageRating: { label: 'Rating', color: 'hsl(var(--chart-4))' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Statistik lengkap platform Arah Umroh</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Booking"
          value={bookingStats?.totalBookings || 0}
          icon={ShoppingCart}
          trend={bookingTrendPercent}
          trendLabel="vs bulan lalu"
        />
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(bookingStats?.totalRevenue || 0)}
          icon={DollarSign}
          trend={revenueTrendPercent}
          trendLabel="vs bulan lalu"
          variant="success"
        />
        <StatCard
          title="Total Review"
          value={reviewStats?.totalReviews || 0}
          icon={MessageSquare}
          trend={reviewTrendPercent}
          trendLabel="vs bulan lalu"
        />
        <StatCard
          title="Rating Rata-rata"
          value={`${reviewStats?.averageRating || 0} ⭐`}
          icon={Star}
          description={`dari ${reviewStats?.publishedReviews || 0} review`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Booking Pending"
          value={bookingStats?.pendingBookings || 0}
          icon={Clock}
          description="Menunggu konfirmasi"
          variant="warning"
        />
        <StatCard
          title="Booking Selesai"
          value={bookingStats?.completedBookings || 0}
          icon={CheckCircle}
          description="Ibadah selesai"
          variant="success"
        />
        <StatCard
          title="Review Pending"
          value={reviewStats?.pendingReviews || 0}
          icon={AlertCircle}
          description="Menunggu moderasi"
          variant="warning"
        />
        <StatCard
          title="Pembayaran Pending"
          value={formatCurrency(bookingStats?.remainingRevenue || 0)}
          icon={DollarSign}
          description="Sisa pembayaran"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Booking (30 Hari)</CardTitle>
            <CardDescription>Jumlah booking harian</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bookingChartConfig} className="h-[300px]">
              <AreaChart data={bookingTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: id })}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => format(new Date(value), 'd MMMM yyyy', { locale: id })}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Pendapatan (30 Hari)</CardTitle>
            <CardDescription>Total pendapatan harian</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bookingChartConfig} className="h-[300px]">
              <AreaChart data={bookingTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: id })}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => format(new Date(value), 'd MMMM yyyy', { locale: id })}
                  formatter={(value: any) => [formatFullCurrency(value), 'Pendapatan']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Booking</CardTitle>
            <CardDescription>Distribusi status booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Rating</CardTitle>
            <CardDescription>Jumlah review per rating</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={reviewChartConfig} className="h-[300px]">
              <BarChart data={ratingDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="rating" tick={{ fontSize: 12 }} width={50} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Travels by Booking */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Terlaris</CardTitle>
            <CardDescription>Berdasarkan jumlah booking</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingStats?.topTravels && bookingStats.topTravels.length > 0 ? (
              <div className="space-y-4">
                {bookingStats.topTravels.map((travel, index) => (
                  <div key={travel.travel_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{travel.travel_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(travel.total_revenue)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{travel.total_bookings} booking</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada data booking</p>
            )}
          </CardContent>
        </Card>

        {/* Top Rated Travels */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Rating Terbaik</CardTitle>
            <CardDescription>Minimal 3 review</CardDescription>
          </CardHeader>
          <CardContent>
            {reviewStats?.topRatedTravels && reviewStats.topRatedTravels.length > 0 ? (
              <div className="space-y-4">
                {reviewStats.topRatedTravels.map((travel, index) => (
                  <div key={travel.travel_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{travel.travel_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {travel.total_reviews} review
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {travel.average_rating.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada travel dengan 3+ review</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Platform</CardTitle>
          <CardDescription>Data keseluruhan platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{platformStats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Pengguna</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{platformStats?.totalAgents || 0}</p>
                <p className="text-xs text-muted-foreground">Total Agen</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{platformStats?.totalTravels || 0}</p>
                <p className="text-xs text-muted-foreground">Total Travel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{platformStats?.totalPackages || 0}</p>
                <p className="text-xs text-muted-foreground">Total Paket</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{platformStats?.activeMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Member Aktif</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(platformStats?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground">Revenue Membership</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
