import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, BarChart3, ShoppingBag, Tag, PackageCheck, Users, LayoutDashboard
} from 'lucide-react';
import ShopProductsManagement from '@/components/admin/ShopProductsManagement';
import ShopCategoriesManagement from '@/components/admin/ShopCategoriesManagement';
import ShopOrdersManagement from '@/components/admin/ShopOrdersManagement';
import ShopDashboard from '@/components/admin/ShopDashboard';
import SellerManagement from '@/components/admin/SellerManagement';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Produk', icon: ShoppingBag },
  { id: 'categories', label: 'Kategori', icon: Tag },
  { id: 'orders', label: 'Pesanan', icon: PackageCheck },
  { id: 'sellers', label: 'Seller', icon: Users },
];

const ShopAdminDashboard = () => {
  const { user, loading, isShopAdmin, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isShopAdmin() && !isAdmin())) {
    navigate('/');
    return null;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <ShopDashboard />;
      case 'products': return <ShopProductsManagement />;
      case 'categories': return <ShopCategoriesManagement />;
      case 'orders': return <ShopOrdersManagement />;
      case 'sellers': return <SellerManagement />;
      default: return <ShopDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Store Admin</h1>
              <p className="text-[10px] text-muted-foreground">Kelola toko</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeMenu === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-10 bg-card border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Store Admin</h1>
          </div>
          <div className="flex overflow-x-auto px-2 pb-2 gap-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  activeMenu === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ShopAdminDashboard;
