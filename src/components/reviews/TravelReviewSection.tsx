import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { Separator } from '@/components/ui/separator';

interface TravelReviewSectionProps {
  travelId: string;
  travelName: string;
}

export const TravelReviewSection = ({ travelId, travelName }: TravelReviewSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Rating & Review</h3>
        <ReviewForm travelId={travelId} travelName={travelName} />
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">
          Ulasan dari Jamaah Lain
        </h4>
        <ReviewList travelId={travelId} />
      </div>
    </div>
  );
};
