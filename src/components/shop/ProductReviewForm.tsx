import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useCreateProductReview } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface ProductReviewFormProps {
  productId: string;
  orderId: string;
  productName: string;
  onDone?: () => void;
}

const ProductReviewForm = ({ productId, orderId, productName, onDone }: ProductReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const createReview = useCreateProductReview();

  const handleSubmit = () => {
    if (rating === 0) return;
    createReview.mutate(
      { product_id: productId, order_id: orderId, rating, review_text: text || undefined },
      { onSuccess: () => onDone?.() }
    );
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <p className="text-sm font-medium">Review: {productName}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star className={cn(
              "h-6 w-6 transition-colors",
              (hovered || rating) >= i ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            )} />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Tulis ulasan Anda (opsional)"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
      />
      <Button size="sm" onClick={handleSubmit} disabled={rating === 0 || createReview.isPending}>
        {createReview.isPending ? 'Mengirim...' : 'Kirim Review'}
      </Button>
    </div>
  );
};

export default ProductReviewForm;
