import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { SellerStats } from '@/hooks/useSellerOrders';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface SellerStatsTabProps {
  stats: SellerStats;
  isLoading: boolean;
}

const SellerStatsTab = ({ stats, isLoading }: SellerStatsTabProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{formatRupiah(stats.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Pendapatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Pesanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{stats.totalItemsSold}</p>
            <p className="text-xs text-muted-foreground">Item Terjual</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Produk Terlaris
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada penjualan</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                      {idx + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.count} terjual</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatRupiah(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerStatsTab;
