import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Package, MessageSquare, Calendar, Target,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAgentBookings, usePaymentStats } from '@/hooks/useBookings';
import { useAgentInquiries, useInquiryStats } from '@/hooks/useInquiries';
import { usePackageStats, useInterestTrend } from '@/hooks/usePackageInterests';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AnalyticsDashboardProps {
  travelId?: string;
}

const formatPrice = (price: number) => {
  if (price >= 1000000000) {
    return `Rp ${(price / 1000000000).toFixed(1)}M`;
  }
  if (price >= 1000000) {
    return `Rp ${(price / 1000000).toFixed(1)}Jt`;
  }
  return `Rp ${price.toLocaleString('id-ID')}`;
};

const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  subtitle
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}) => {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              trend === 'up' ? 'bg-green-100 text-green-600' :
              trend === 'down' ? 'bg-red-100 text-red-600' :
              'bg-primary/10 text-primary'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          {change !== undefined && TrendIcon && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(change)}% dari bulan lalu</span>
            </div>
          )}
        </CardContent>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
          trend === 'up' ? 'bg-green-500' :
          trend === 'down' ? 'bg-red-500' :
          'bg-primary'
        }`} />
      </Card>
    </motion.div>
  );
};

const AnalyticsDashboard = ({ travelId }: AnalyticsDashboardProps) => {
  const { data: bookings } = useAgentBookings(travelId);
  const { data: inquiries } = useAgentInquiries(travelId);
  const { data: inquiryStats } = useInquiryStats(travelId);
  const { data: packageStats } = usePackageStats(travelId);
  const { data: trendData } = useInterestTrend(travelId, 30);
  const paymentStats = usePaymentStats(travelId);

  // Calculate booking metrics
  const bookingMetrics = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return { 
        totalRevenue: 0, 
        totalBookings: 0, 
        avgOrderValue: 0,
        completionRate: 0,
        monthlyData: [],
        statusData: []
      };
    }

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
    const totalBookings = bookings.length;
    const avgOrderValue = totalRevenue / totalBookings;
    const completedBookings = bookings.filter(b => b.status === 'paid' || b.status === 'completed').length;
    const completionRate = Math.round((completedBookings / totalBookings) * 100);

    // Group by status
    const statusCounts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'pending' ? 'Menunggu' :
            status === 'confirmed' ? 'Dikonfirmasi' :
            status === 'paid' ? 'Lunas' :
            status === 'cancelled' ? 'Dibatalkan' : 'Selesai',
      value: count,
    }));

    // Monthly trend (last 30 days)
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    const monthlyData = last30Days.map(date => {
      const dayBookings = bookings.filter(b => 
        format(new Date(b.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        date: format(date, 'd MMM', { locale: idLocale }),
        bookings: dayBookings.length,
        revenue: dayBookings.reduce((sum, b) => sum + (b.paid_amount || 0), 0),
      };
    });

    return { totalRevenue, totalBookings, avgOrderValue, completionRate, monthlyData, statusData };
  }, [bookings]);

  // Calculate inquiry conversion
  const conversionMetrics = useMemo(() => {
    if (!inquiries || inquiries.length === 0 || !bookings) {
      return { conversionRate: 0, avgResponseTime: 0, inquiryTrend: [] };
    }

    const totalInquiries = inquiries.length;
    const convertedInquiries = inquiries.filter(i => i.status === 'converted').length;
    const conversionRate = Math.round((convertedInquiries / totalInquiries) * 100);

    // Calculate average response time (in hours)
    const respondedInquiries = inquiries.filter(i => i.contacted_at);
    const avgResponseTime = respondedInquiries.length > 0
      ? respondedInquiries.reduce((sum, i) => {
          const created = new Date(i.created_at).getTime();
          const contacted = new Date(i.contacted_at!).getTime();
          return sum + (contacted - created) / (1000 * 60 * 60);
        }, 0) / respondedInquiries.length
      : 0;

    // Inquiry status distribution
    const statusCounts = inquiries.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const inquiryTrend = [
      { name: 'Baru', value: statusCounts['pending'] || 0 },
      { name: 'Dihubungi', value: statusCounts['contacted'] || 0 },
      { name: 'Konversi', value: statusCounts['converted'] || 0 },
      { name: 'Ditolak', value: statusCounts['cancelled'] || 0 },
    ];

    return { conversionRate, avgResponseTime, inquiryTrend };
  }, [inquiries, bookings]);

  // Package performance
  const packagePerformance = useMemo(() => {
    if (!packageStats || packageStats.length === 0) return [];
    
    return packageStats.slice(0, 5).map(pkg => ({
      name: pkg.package_name.substring(0, 15) + (pkg.package_name.length > 15 ? '...' : ''),
      views: pkg.total_views,
      inquiries: pkg.unique_users,
      whatsapp: pkg.whatsapp_clicks,
    }));
  }, [packageStats]);

  // Interest trend for chart
  const interestChartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    
    return trendData.map(d => ({
      date: format(new Date(d.date), 'd MMM', { locale: idLocale }),
      views: d.views,
      inquiries: 0,
      whatsapp: d.clicks,
    }));
  }, [trendData]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Ringkasan Performa
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            title="Total Pendapatan"
            value={formatPrice(bookingMetrics.totalRevenue)}
            icon={DollarSign}
            trend="up"
            change={12}
          />
          <StatCard 
            title="Total Booking"
            value={bookingMetrics.totalBookings}
            icon={Package}
            trend="up"
            change={8}
          />
          <StatCard 
            title="Konversi Inquiry"
            value={`${conversionMetrics.conversionRate}%`}
            icon={Target}
            trend={conversionMetrics.conversionRate > 20 ? 'up' : 'down'}
            subtitle={`${inquiryStats?.total || 0} total inquiry`}
          />
          <StatCard 
            title="Rata-rata Order"
            value={formatPrice(bookingMetrics.avgOrderValue)}
            icon={Users}
            trend="neutral"
          />
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Tren Pendapatan (30 Hari)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingMetrics.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={bookingMetrics.monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  tickFormatter={(value) => formatPrice(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [formatPrice(value), 'Pendapatan']}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#059669" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Belum ada data pendapatan
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interest Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Tren Minat Paket
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interestChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={interestChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="views" name="Views" fill="#059669" radius={[2, 2, 0, 0]} />
                <Bar dataKey="inquiries" name="Inquiry" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="whatsapp" name="WhatsApp" fill="#34D399" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Belum ada data minat
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel & Booking Status */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <PieChart className="w-3 h-3" />
              Status Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingMetrics.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <RechartsPie>
                  <Pie
                    data={bookingMetrics.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {bookingMetrics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: 9 }} 
                    layout="vertical" 
                    align="right"
                    verticalAlign="middle"
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[150px] text-muted-foreground text-xs">
                Belum ada data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Target className="w-3 h-3" />
              Konversi Inquiry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversionMetrics.inquiryTrend.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={150}>
                <RechartsPie>
                  <Pie
                    data={conversionMetrics.inquiryTrend}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {conversionMetrics.inquiryTrend.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: 9 }} 
                    layout="vertical" 
                    align="right"
                    verticalAlign="middle"
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[150px] text-muted-foreground text-xs">
                Belum ada data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Packages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            Performa Paket Terbaik
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packagePerformance.length > 0 ? (
            <div className="space-y-3">
              {packagePerformance.map((pkg, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pkg.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {pkg.views} views
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {pkg.inquiries} inquiry
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">
                        {pkg.whatsapp} WA
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Belum ada data paket
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Stats */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Calendar className="w-4 h-4" />
            Status Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{paymentStats.pendingPayments}</p>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </div>
            <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{paymentStats.overduePayments}</p>
              <p className="text-xs text-muted-foreground">Terlambat</p>
            </div>
            <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{formatPrice(paymentStats.totalPaid)}</p>
              <p className="text-xs text-muted-foreground">Terbayar</p>
            </div>
            <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
              <p className="text-2xl font-bold text-foreground">{formatPrice(paymentStats.totalRemaining)}</p>
              <p className="text-xs text-muted-foreground">Sisa</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
