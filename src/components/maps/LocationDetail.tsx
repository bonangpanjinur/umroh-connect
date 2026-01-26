import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, Lightbulb, ExternalLink } from 'lucide-react';
import { Location, formatDistance, getCategoryLabel } from '@/data/locationsData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LocationDetailProps {
  location: Location;
  distance?: number | null;
  onBack: () => void;
  onNavigate: (location: Location) => void;
}

const LocationDetail = ({ location, distance, onBack, onNavigate }: LocationDetailProps) => {
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-foreground truncate">{location.name}</h2>
          <p className="text-sm text-primary font-arabic">{location.nameArabic}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Category & Distance */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary">
            {getCategoryLabel(location.category)}
          </Badge>
          <Badge variant="outline">{location.city}</Badge>
          {distance !== null && distance !== undefined && (
            <Badge variant="outline" className="bg-accent/10">
              <MapPin className="w-3 h-3 mr-1" />
              {formatDistance(distance)}
            </Badge>
          )}
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <p className="text-foreground leading-relaxed">
              {location.description}
            </p>
          </CardContent>
        </Card>

        {/* Tips */}
        {location.tips && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-accent/20 shrink-0">
                  <Lightbulb className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-accent-foreground mb-1">Tips</h4>
                  <p className="text-sm text-muted-foreground">{location.tips}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coordinates */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Koordinat</h4>
            <p className="text-sm font-mono text-foreground">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={openGoogleMaps}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Buka di Google Maps
        </Button>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => onNavigate(location)}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Lihat di Peta
        </Button>
      </div>
    </motion.div>
  );
};

export default LocationDetail;
