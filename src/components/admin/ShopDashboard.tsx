import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminShopOrders, useAdminShopProducts } from '@/hooks/useShopAdmin';
import { ShopOrderStatus } from '@/types/shop';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const ShopDashboard = () => {
  const { data: orders = [] } = useAdminShopOrders();
  const { data: products = [] } = useAdminShopProducts();

  const paidStatuses: ShopOrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];
  const paidOrders = orders.filter((o) => paidStatuses.includes(o.status as ShopOrderStatus));
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.stock <= 5).length;

  // Top products by quantity sold
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  paidOrders.forEach((order) => {
    order.items?.forEach((item) => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
      }
      productSales[item.product_name].qty += item.quantity;
      productSales[item.product_name].revenue += item.subtotal;
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const stats = [
    { label: 'Total Revenue', value: formatRupiah(totalRevenue), icon: DollarSign, color: 'text-green-600' },
    { label: 'Pesanan Dibayar', value: paidOrders.length, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Menunggu Bayar', value: pendingOrders, icon: TrendingUp, color: 'text-yellow-600' },
    { label: 'Produk Aktif', value: totalProducts, icon: Package, color: 'text-purple-600', sub: lowStock > 0 ? `${lowStock} stok rendah` : undefined },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              {s.sub && <p className="text-xs text-orange-500 mt-1">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Products Chart */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'qty' ? [`${value} terjual`, 'Jumlah'] : [formatRupiah(value), 'Revenue']
                    }
                  />
                  <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {lowStock > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-base text-orange-600">⚠️ Stok Rendah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products
                .filter((p) => p.stock <= 5)
                .map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="font-medium text-orange-600">{p.stock} tersisa</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShopDashboard;
