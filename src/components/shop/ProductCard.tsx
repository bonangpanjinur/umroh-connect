import { ShopProduct } from '@/types/shop';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface ProductCardProps {
  product: ShopProduct;
  onClick: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <Card className="overflow-hidden cursor-pointer group hover:shadow-float transition-shadow" onClick={onClick}>
      <div className="relative aspect-square bg-muted">
        {product.thumbnail_url ? (
          <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        {discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">-{discount}%</Badge>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Badge variant="secondary">Habis</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-primary text-sm">{formatRupiah(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-muted-foreground line-through">{formatRupiah(product.compare_price)}</span>
          )}
        </div>
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-destructive mt-1">Sisa {product.stock}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
