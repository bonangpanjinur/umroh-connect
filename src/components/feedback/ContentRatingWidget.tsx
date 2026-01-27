import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';
import { useContentRating } from '@/hooks/useFeedback';
import { useAuthContext as useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ContentRatingWidgetProps {
  contentType: 'manasik' | 'prayer' | 'location';
  contentId: string;
  compact?: boolean;
}

const ContentRatingWidget = ({ contentType, contentId, compact = false }: ContentRatingWidgetProps) => {
  const { user } = useAuth();
  const { userRating, averageRating, isLoading, submitRating } = useContentRating(contentType, contentId);
  
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const handleRatingClick = (rating: number) => {
    if (!user) return;
    setSelectedRating(rating);
    setShowCommentInput(true);
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    await submitRating.mutateAsync({ rating: selectedRating, comment: comment.trim() || undefined });
    setShowCommentInput(false);
    setComment('');
  };

  const displayRating = hoverRating || selectedRating || userRating?.rating || 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">
            {averageRating?.average ? averageRating.average.toFixed(1) : '-'}
          </span>
        </div>
        {averageRating?.count ? (
          <span className="text-xs text-muted-foreground">
            ({averageRating.count} rating)
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">Rating Konten</h4>
        {averageRating?.count ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{averageRating.average.toFixed(1)}</span>
            <span>({averageRating.count})</span>
          </div>
        ) : null}
      </div>

      {user ? (
        <>
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(star)}
                className="p-0.5"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= displayRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {userRating && !showCommentInput && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="w-3 h-3" />
              <span>Anda memberi rating {userRating.rating} bintang</span>
            </div>
          )}

          {showCommentInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tambahkan komentar (opsional)..."
                className="text-sm min-h-[60px]"
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCommentInput(false);
                    setSelectedRating(0);
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitRating.isPending}
                  className="flex-1"
                >
                  {submitRating.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Kirim'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <p className="text-xs text-center text-muted-foreground">
          Login untuk memberi rating
        </p>
      )}
    </div>
  );
};

export default ContentRatingWidget;
