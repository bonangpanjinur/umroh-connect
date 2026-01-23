import { useTravelReviews, useReviewStats } from '@/hooks/useReviews';
import { StarRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ReviewListProps {
  travelId: string;
  showStats?: boolean;
}

export const ReviewList = ({ travelId, showStats = true }: ReviewListProps) => {
  const { data: reviews, isLoading: loadingReviews } = useTravelReviews(travelId);
  const { data: stats, isLoading: loadingStats } = useReviewStats(travelId);

  if (loadingReviews || loadingStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Belum ada review untuk travel ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {showStats && stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stats.average_rating.toFixed(1)}
                </div>
                <StarRating rating={stats.average_rating} size="sm" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total_reviews} review
                </p>
              </div>

              {/* Distribution */}
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.rating_distribution[star] || 0;
                  const percentage = stats.total_reviews > 0 
                    ? (count / stats.total_reviews) * 100 
                    : 0;
                  
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-3">
                        {star}
                      </span>
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={review.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {review.profile?.full_name || 'Jamaah'}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(review.created_at), 'd MMM yyyy', { locale: id })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating} size="sm" />
                    {review.is_verified_purchase && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Terverifikasi
                      </span>
                    )}
                  </div>

                  {review.review_text && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {review.review_text}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
