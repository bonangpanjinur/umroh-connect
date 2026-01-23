import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { useSubmitReview, useUserReview } from '@/hooks/useReviews';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Edit2 } from 'lucide-react';

interface ReviewFormProps {
  travelId: string;
  travelName: string;
  onSuccess?: () => void;
}

export const ReviewForm = ({ travelId, travelName, onSuccess }: ReviewFormProps) => {
  const { user } = useAuthContext();
  const { data: existingReview, isLoading: loadingReview } = useUserReview(travelId);
  const submitReview = useSubmitReview();
  
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [isEditing, setIsEditing] = useState(!existingReview);

  // Update state when existing review loads
  useState(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text || '');
      setIsEditing(false);
    }
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Pilih rating terlebih dahulu');
      return;
    }

    try {
      await submitReview.mutateAsync({
        travelId,
        rating,
        reviewText: reviewText.trim() || undefined,
      });
      
      toast.success(existingReview ? 'Review berhasil diperbarui' : 'Review berhasil dikirim');
      setIsEditing(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim review');
    }
  };

  if (!user) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Login untuk memberikan review
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loadingReview) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (existingReview && !isEditing) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Review Anda</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <StarRating rating={existingReview.rating} size="md" />
          {existingReview.review_text && (
            <p className="mt-2 text-sm text-muted-foreground">
              {existingReview.review_text}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {existingReview ? 'Edit Review' : `Beri Rating untuk ${travelName}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <StarRating
            rating={rating}
            size="lg"
            interactive
            onRatingChange={setRating}
          />
          <span className="text-sm text-muted-foreground">
            {rating === 0 && 'Tap bintang untuk memberi rating'}
            {rating === 1 && 'Sangat Buruk'}
            {rating === 2 && 'Buruk'}
            {rating === 3 && 'Cukup'}
            {rating === 4 && 'Baik'}
            {rating === 5 && 'Sangat Baik'}
          </span>
        </div>

        <Textarea
          placeholder="Tulis pengalaman Anda dengan travel ini (opsional)..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          className="resize-none"
        />

        <div className="flex gap-2">
          {existingReview && (
            <Button
              variant="outline"
              onClick={() => {
                setRating(existingReview.rating);
                setReviewText(existingReview.review_text || '');
                setIsEditing(false);
              }}
              className="flex-1"
            >
              Batal
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReview.isPending}
            className="flex-1"
          >
            {submitReview.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {existingReview ? 'Perbarui Review' : 'Kirim Review'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
