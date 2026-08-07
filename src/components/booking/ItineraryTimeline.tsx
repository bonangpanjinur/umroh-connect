import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Route } from 'lucide-react';
import { useDepartureItinerary } from '@/hooks/useItinerary';

interface ItineraryTimelineProps {
  departureId?: string | null;
}

const ItineraryTimeline = ({ departureId }: ItineraryTimelineProps) => {
  const { data: days, isLoading } = useDepartureItinerary(departureId);

  if (!departureId) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Route className="h-4 w-4" />
          Itinerary Perjalanan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !days || days.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Travel belum menerbitkan itinerary untuk keberangkatan ini.
          </p>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-4">
            {days.map((day) => (
              <li key={day.id} className="ml-4">
                <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {day.day_number}
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    Hari {day.day_number} · {day.title}
                  </p>
                  {day.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {day.city}
                    </p>
                  )}
                  {day.description && (
                    <p className="text-xs text-muted-foreground">{day.description}</p>
                  )}
                  {day.activities && day.activities.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                      {day.activities.map((activity, i) => (
                        <li key={i}>{activity}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default ItineraryTimeline;
