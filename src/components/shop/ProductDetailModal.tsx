import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShopProduct } from '@/types/shop';
import { useShopCart } from '@/hooks/useShopCart';
import { useAuthContext } from '@/contexts/AuthContext';
import { Minus, Plus, ShoppingCart, ShoppingBag, LogIn, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ProductReviews from './ProductReviews';
import { useProductRatingStats } from '@/hooks/useProductReviews';
import { Star } from 'lucide-react';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface ProductDetailModalProps {
  product: ShopProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  const [qty, setQty] = useState(1);
  const { addToCart } = useShopCart();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!product) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.thumbnail_url ? (
              <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

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
