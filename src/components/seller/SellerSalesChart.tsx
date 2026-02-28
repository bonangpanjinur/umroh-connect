import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SellerOrderItem } from '@/hooks/useSellerOrders';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface SellerSalesChartProps {
  items: SellerOrderItem[];
}

const SellerSalesChart = ({ items }: SellerSalesChartProps) => {
  const chartData = useMemo(() => {
    const paidItems = items.filter(
      i => i.order && ['paid', 'processing', 'shipped', 'delivered'].includes(i.order.status)
    );

    const dailyMap = new Map<string, number>();
    paidItems.forEach(item => {
      const date = new Date(item.order!.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      dailyMap.set(date, (dailyMap.get(date) || 0) + item.subtotal);
    });

    return Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-14); // last 14 days
  }, [items]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Grafik Penjualan</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-4">Belum ada data penjualan</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Penjualan 14 Hari Terakhir</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" />
            <Tooltip formatter={(value: number) => [formatRupiah(value), 'Pendapatan']} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SellerSalesChart;
