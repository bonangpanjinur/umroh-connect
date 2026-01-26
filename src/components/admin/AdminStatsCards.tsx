import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStats } from '@/hooks/useAdminData';
import { Users, Building2, Package, CreditCard, TrendingUp, Clock } from 'lucide-react';

export const AdminStatsCards = () => {
  const { data: stats, isLoading } = useAdminStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pengguna',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Semua pengguna terdaftar'
    },
    {
      title: 'Total Agen',
      value: stats?.totalAgents || 0,
      icon: Users,
      description: 'Pengguna dengan role agen'
    },
    {
      title: 'Total Travel',
      value: stats?.totalTravels || 0,
      icon: Building2,
      description: 'Travel agency terdaftar'
    },
    {
      title: 'Total Paket',
      value: stats?.totalPackages || 0,
      icon: Package,
      description: 'Paket umroh tersedia'
    },
    {
      title: 'Member Aktif',
      value: stats?.activeMembers || 0,
      icon: CreditCard,
      description: 'Keanggotaan berbayar aktif'
    },
    {
      title: 'Menunggu Approval',
      value: stats?.pendingMembers || 0,
      icon: Clock,
      description: 'Pengajuan keanggotaan pending'
    },
    {
      title: 'Total Pendapatan',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      description: 'Dari keanggotaan aktif',
      isLarge: true
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistik Platform</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={stat.isLarge ? 'md:col-span-2' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
