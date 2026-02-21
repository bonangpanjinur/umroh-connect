import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShopProduct } from '@/types/shop';
import { useShopCart } from '@/hooks/useShopCart';
import { useAuthContext } from '@/contexts/AuthContext';
import { Minus, Plus, ShoppingCart, ShoppingBag, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ProductReviews from './ProductReviews';
import WishlistButton from './WishlistButton';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface ProductDetailModalProps {
  product: ShopProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  const [qty, setQty] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const { addToCart } = useShopCart();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!product) return null;

  // Combine thumbnail + images array
  const allImages = [
    product.thumbnail_url,
    ...(product.images || []),
  ].filter(Boolean) as string[];

  const handleAddToCart = () => {
    if (!user) {
      toast({ title: 'Silakan login terlebih dahulu', variant: 'destructive' });
      onOpenChange(false);
      navigate('/auth');
      return;
    }
    addToCart.mutate({ productId: product.id, quantity: qty }, {
      onSuccess: () => {
        setQty(1);
        onOpenChange(false);
      },
    });
  };

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const prevImage = () => setCurrentImage((p) => (p - 1 + allImages.length) % allImages.length);
  const nextImage = () => setCurrentImage((p) => (p + 1) % allImages.length);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setCurrentImage(0); onOpenChange(o); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Image carousel */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {allImages.length > 0 ? (
              <>
                <img src={allImages[currentImage]} alt={product.name} className="w-full h-full object-cover" />
                {allImages.length > 1 && (
                  <>
                    <Button variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/60 backdrop-blur-sm" onClick={prevImage}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/60 backdrop-blur-sm" onClick={nextImage}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${i === currentImage ? 'bg-primary' : 'bg-background/60'}`}
                          onClick={() => setCurrentImage(i)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <WishlistButton productId={product.id} size="default" className="bg-background/70 backdrop-blur-sm hover:bg-background/90" />
            </div>
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  className={`w-14 h-14 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${i === currentImage ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => setCurrentImage(i)}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-primary">{formatRupiah(product.price)}</span>
              {product.compare_price && (
                <>
                  <span className="text-sm text-muted-foreground line-through">{formatRupiah(product.compare_price)}</span>
                  <Badge variant="destructive" className="text-xs">-{discount}%</Badge>
                </>
              )}
            </div>
            {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
          </div>

          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

          {/* Seller link */}
          {product.seller && (
            <button
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              onClick={() => { onOpenChange(false); navigate(`/store/${product.seller_id}`); }}
            >
              <Store className="h-4 w-4" />
              {product.seller.shop_name}
              {product.seller.is_verified && ' ✓'}
            </button>
          )}

          {/* Reviews */}
          <ProductReviews productId={product.id} />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Stok: <strong className={product.stock > 0 ? 'text-foreground' : 'text-destructive'}>{product.stock > 0 ? product.stock : 'Habis'}</strong></span>
            {product.weight_gram && <span>• Berat: {product.weight_gram}g</span>}
          </div>

          {product.stock > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}><Minus className="h-4 w-4" /></Button>
                <span className="font-semibold w-8 text-center">{qty}</span>
                <Button size="icon" variant="outline" onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={qty >= product.stock}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button onClick={handleAddToCart} disabled={addToCart.isPending}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addToCart.isPending ? 'Menambahkan...' : 'Tambah'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
