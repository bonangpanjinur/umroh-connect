import { Star } from 'lucide-react';
import { useProductReviews } from '@/hooks/useProductReviews';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { data: reviews = [], isLoading } = useProductReviews(productId);

  if (isLoading) return null;
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={cn("h-4 w-4", avg >= i ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
          ))}
        </div>
        <span className="text-sm font-medium">{avg.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({reviews.length} ulasan)</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {reviews.slice(0, 5).map(r => (
          <div key={r.id} className="border-b pb-2 last:border-0">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={cn("h-3 w-3", r.rating >= i ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {r.profile?.full_name || 'Anonim'} · {format(new Date(r.created_at), 'dd/MM/yy')}
              </span>
            </div>
            {r.review_text && <p className="text-xs text-muted-foreground mt-1">{r.review_text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
