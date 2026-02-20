import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Star, BadgeCheck, MapPin, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import ProductDetailModal from '@/components/shop/ProductDetailModal';
import { ShopProduct } from '@/types/shop';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const StorePage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

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

  const { data: products = [] } = useQuery({
    queryKey: ['store-products', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopProduct[];
    },
    enabled: !!sellerId,
  });

  if (loadingSeller) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Toko tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg truncate">{seller.shop_name}</h2>
      </div>

      {/* Store info */}
      <div className="p-4 border-b space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{seller.shop_name}</h1>
          {seller.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
        </div>
        {seller.city && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {seller.city}
          </p>
        )}
        {(seller as any).description && <p className="text-sm text-muted-foreground">{(seller as any).description}</p>}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{seller.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="text-muted-foreground">{seller.review_count || 0} ulasan</span>
        </div>
      </div>

      {/* Products */}
      <div className="p-4">
        <h3 className="font-semibold mb-3">Produk ({products.length})</h3>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>Belum ada produk</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <Card key={p.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedProduct(p)}>
                <div className="aspect-square bg-muted">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-primary">{formatRupiah(p.price)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onOpenChange={o => !o && setSelectedProduct(null)} />
    </div>
  );
};

export default StorePage;
