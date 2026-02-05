import { motion } from 'framer-motion';
import { Package, Users, TrendingUp, DollarSign, Star, Calendar, Eye, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface AgentQuickStatsProps {
  stats: StatItem[];
  isLoading?: boolean;
}

export const AgentQuickStats = ({ stats, isLoading = false }: AgentQuickStatsProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-secondary rounded w-1/2 animate-pulse" />
                <div className="h-8 bg-secondary rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-secondary rounded w-1/3 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <motion.div key={stat.id} variants={itemVariants}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                {stat.change !== undefined && (
                  <Badge
                    variant={stat.change >= 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Preset stats configurations
export const defaultAgentStats = (data: any) => [
  {
    id: 'packages',
    label: 'Paket Aktif',
    value: data.packages || 0,
    icon: <Package className="w-6 h-6" />,
    color: 'bg-blue-500/10 text-blue-600',
    description: 'Total paket yang tersedia',
  },
  {
    id: 'bookings',
    label: 'Booking Bulan Ini',
    value: data.bookings || 0,
    change: data.bookingChange || 0,
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'bg-green-500/10 text-green-600',
    description: 'Pesanan yang masuk',
  },
  {
    id: 'revenue',
    label: 'Pendapatan',
    value: `Rp ${(data.revenue || 0).toLocaleString('id-ID')}`,
    change: data.revenueChange || 0,
    icon: <DollarSign className="w-6 h-6" />,
    color: 'bg-emerald-500/10 text-emerald-600',
    description: 'Komisi yang diterima',
  },
  {
    id: 'rating',
    label: 'Rating Rata-rata',
    value: (data.rating || 0).toFixed(1),
    icon: <Star className="w-6 h-6" />,
    color: 'bg-amber-500/10 text-amber-600',
    description: `Dari ${data.reviews || 0} review`,
  },
];
