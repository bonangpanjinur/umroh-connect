import { Star } from 'lucide-react';
import { useProductRatingStats } from '@/hooks/useProductReviews';

interface ProductRatingBadgeProps {
  productId: string;
}

const ProductRatingBadge = ({ productId }: ProductRatingBadgeProps) => {
  const { average, count } = useProductRatingStats(productId);
  
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      <span>{average}</span>
      <span>• {count} ulasan</span>
    </div>
  );
};

export default ProductRatingBadge;
