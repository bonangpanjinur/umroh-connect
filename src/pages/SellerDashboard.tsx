import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSellerProfile, useSellerProducts, useSellerPlanLimits, useDeleteSellerProduct } from '@/hooks/useSeller';
import { useSellerStats } from '@/hooks/useSellerOrders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Plus, BarChart3, Settings, Trash2, Edit, Star, ClipboardList, MessageSquare, ExternalLink, Copy } from 'lucide-react';
import ChatNotificationBell from '@/components/shop/ChatNotificationBell';
import OrderNotificationBell from '@/components/shop/OrderNotificationBell';
import { useToast } from '@/hooks/use-toast';
import SellerApplicationForm from '@/components/seller/SellerApplicationForm';
import SellerProductForm from '@/components/seller/SellerProductForm';
import SellerStatsTab from '@/components/seller/SellerStatsTab';
import SellerOrdersTab from '@/components/seller/SellerOrdersTab';
import SellerSettingsTab from '@/components/seller/SellerSettingsTab';
import SellerChatTab from '@/components/seller/SellerChatTab';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { ShopProduct } from '@/types/shop';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const SellerDashboard = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: sellerProfile, isLoading: loadingProfile } = useSellerProfile();
  const { data: products = [], isLoading: loadingProducts } = useSellerProducts(sellerProfile?.id);
  const { maxProducts, currentPlan } = useSellerPlanLimits(sellerProfile?.id);
  const deleteMutation = useDeleteSellerProduct();
  const { stats, allItems: orderItems, isLoading: loadingStats } = useSellerStats(sellerProfile?.id);
  const [activeTab, setActiveTab] = useState('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);

  // Enable realtime order updates
  useRealtimeOrders();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not a seller yet -> show application form
  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Seller Center</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-lg">
          <SellerApplicationForm />
        </main>
      </div>
    );
  }

  if (showProductForm || editingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">Seller Center</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-lg">
          <SellerProductForm
            sellerId={sellerProfile.id}
            product={editingProduct as any}
            onBack={() => { setShowProductForm(false); setEditingProduct(null); }}
          />
        </main>
      </div>
    );
  }

  const productCount = products.length;
  const canAddMore = productCount < maxProducts;

  const handleAddProduct = () => {
    if (!canAddMore) {
      toast({
        title: 'Batas produk tercapai',
        description: `Upgrade membership untuk menambah lebih dari ${maxProducts} produk.`,
        variant: 'destructive',
      });
      return;
    }
    setShowProductForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{sellerProfile.shop_name}</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Seller Dashboard</p>
              {sellerProfile.is_verified && <Badge className="bg-green-500 text-xs">Verified</Badge>}
              {sellerProfile.rating > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {sellerProfile.rating}
                </span>
              )}
            </div>
          </div>
          <OrderNotificationBell />
          <ChatNotificationBell />
          <Button variant="ghost" size="icon" onClick={() => window.open(`/store/${sellerProfile.id}`, '_blank')} title="Lihat Toko">
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{productCount}</p>
              <p className="text-xs text-muted-foreground">Produk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{maxProducts}</p>
              <p className="text-xs text-muted-foreground">Maks Produk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{currentPlan?.name || 'Starter'}</p>
              <p className="text-xs text-muted-foreground">Paket</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="products" className="flex items-center gap-1 py-2 text-[11px]">
              <ShoppingBag className="h-3.5 w-3.5" />
              Produk
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 py-2 text-[11px]">
              <ClipboardList className="h-3.5 w-3.5" />
              Pesanan
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1 py-2 text-[11px]">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1 py-2 text-[11px]">
              <BarChart3 className="h-3.5 w-3.5" />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 py-2 text-[11px]">
              <Settings className="h-3.5 w-3.5" />
              Setting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {productCount}/{maxProducts} slot produk terpakai
              </p>
              <Button size="sm" onClick={handleAddProduct} disabled={!canAddMore}>
                <Plus className="h-4 w-4 mr-1" /> Tambah Produk
              </Button>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Belum ada produk</p>
                  <Button size="sm" className="mt-3" onClick={handleAddProduct}>Tambah Produk Pertama</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map((product: any) => (
                  <Card key={product.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {product.thumbnail_url ? (
                          <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{product.name}</h3>
                        <p className="text-sm font-bold text-primary">{formatRupiah(product.price)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-[10px] h-4">
                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct(product)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Duplikat"
                          onClick={() => {
                            setEditingProduct(null);
                            setShowProductForm(true);
                            // Pre-fill form with duplicated data (without id)
                            setTimeout(() => {
                              setEditingProduct({ ...product, id: undefined as any, name: product.name + ' (copy)', slug: '' } as any);
                            }, 0);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm('Hapus produk ini?')) deleteMutation.mutate(product.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <SellerOrdersTab items={orderItems} isLoading={loadingStats} />
          </TabsContent>

          <TabsContent value="chat">
            <SellerChatTab sellerId={sellerProfile.id} sellerName={sellerProfile.shop_name} />
          </TabsContent>

          <TabsContent value="stats">
            <SellerStatsTab stats={stats} isLoading={loadingStats} />
          </TabsContent>

          <TabsContent value="settings">
            <SellerSettingsTab
              sellerProfile={sellerProfile}
              currentPlanName={currentPlan?.name || 'Starter'}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SellerDashboard;
