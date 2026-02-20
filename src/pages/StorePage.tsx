import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Star, BadgeCheck, MapPin, ShoppingBag, Phone, MessageCircle, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import ProductDetailModal from '@/components/shop/ProductDetailModal';
import ShopChatView from '@/components/shop/ShopChatView';
import { useAuthContext } from '@/contexts/AuthContext';
import { ShopProduct } from '@/types/shop';
import { cn } from '@/lib/utils';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const StorePage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showChat, setShowChat] = useState(false);

  const { data: seller, isLoading: loadingSeller } = useQuery({
    queryKey: ['store-profile', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('id', sellerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['store-products', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopProduct[];
    },
    enabled: !!sellerId,
  });

  if (loadingSeller) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Store className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-1">Toko Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mb-4">Halaman toko ini tidak tersedia atau sudah dihapus.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
      </div>
    );
  }

  const whatsappLink = seller.whatsapp
    ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`
    : null;

  // Show chat view
  if (showChat && sellerId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-screen">
          <ShopChatView
            sellerId={sellerId}
            sellerName={seller.shop_name}
            senderRole="buyer"
            onBack={() => setShowChat(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-20 p-3 border-b flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-base truncate">{seller.shop_name}</h2>
        {seller.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
      </div>

      {/* Banner */}
      <div className="relative">
        {seller.banner_url ? (
          <div className="h-36 bg-muted overflow-hidden">
            <img src={seller.banner_url} alt="Store banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        )}

        {/* Logo overlay */}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-xl border-4 border-background bg-muted overflow-hidden shadow-sm">
            {seller.logo_url ? (
              <img src={seller.logo_url} alt={seller.shop_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Store className="h-7 w-7 text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="pt-10 px-4 pb-4 border-b space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{seller.shop_name}</h1>
            {seller.is_verified && (
              <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                <BadgeCheck className="h-3 w-3" /> Terverifikasi
              </Badge>
            )}
          </div>
          {seller.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" /> {seller.city}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{seller.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-muted-foreground">({seller.review_count || 0})</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{products.length} produk</span>
        </div>

        {/* Contact buttons */}
        <div className="flex gap-2">
          {user && (
            <Button size="sm" variant="default" className="text-xs h-8" onClick={() => setShowChat(true)}>
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Chat Penjual
            </Button>
          )}
          {whatsappLink && (
            <Button size="sm" variant="outline" className="text-xs h-8" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                WhatsApp
              </a>
            </Button>
          )}
          {seller.phone && (
            <Button size="sm" variant="ghost" className="text-xs h-8" asChild>
              <a href={`tel:${seller.phone}`}>
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Hubungi
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Semua Produk</h3>
          <span className="text-xs text-muted-foreground">{products.length} item</span>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada produk di toko ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => {
              const discount = p.compare_price
                ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
                : 0;

              return (
                <Card
                  key={p.id}
                  className="overflow-hidden cursor-pointer group hover:shadow-md transition-all"
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {p.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {discount > 0 && (
                      <Badge className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[10px] h-5">
                        -{discount}%
                      </Badge>
                    )}
                    {p.is_featured && (
                      <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-[10px] h-5">
                        ⭐
                      </Badge>
                    )}
                    {p.stock <= 0 && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Badge variant="secondary">Habis</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2.5">
                    <p className="text-sm font-medium line-clamp-2 mb-1">{p.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-primary">{formatRupiah(p.price)}</span>
                      {p.compare_price && (
                        <span className="text-[10px] text-muted-foreground line-through">{formatRupiah(p.compare_price)}</span>
                      )}
                    </div>
                    {p.stock > 0 && p.stock <= 5 && (
                      <p className="text-[10px] text-destructive mt-0.5">Sisa {p.stock}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={o => !o && setSelectedProduct(null)}
      />
    </div>
  );
};

export default StorePage;
