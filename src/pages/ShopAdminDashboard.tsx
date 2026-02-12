import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Tag, PackageCheck, BarChart3 } from 'lucide-react';
import ShopProductsManagement from '@/components/admin/ShopProductsManagement';
import ShopCategoriesManagement from '@/components/admin/ShopCategoriesManagement';
import ShopOrdersManagement from '@/components/admin/ShopOrdersManagement';
import ShopDashboard from '@/components/admin/ShopDashboard';

const ShopAdminDashboard = () => {
  const { user, loading, isShopAdmin, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!loading && (!user || (!isShopAdmin() && !isAdmin()))) {
      navigate('/');
    }
  }, [user, loading, isShopAdmin, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isShopAdmin() && !isAdmin())) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Admin Toko</h1>
            <p className="text-sm text-muted-foreground">Kelola produk, kategori & pesanan</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-2 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2 py-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Produk</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2 py-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Kategori</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 py-2">
              <PackageCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Pesanan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ShopDashboard />
          </TabsContent>
          <TabsContent value="products">
            <ShopProductsManagement />
          </TabsContent>
          <TabsContent value="categories">
            <ShopCategoriesManagement />
          </TabsContent>
          <TabsContent value="orders">
            <ShopOrdersManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ShopAdminDashboard;
