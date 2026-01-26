import { motion } from 'framer-motion';
import { MapPin, Navigation, Info, ChevronRight } from 'lucide-react';
import { Location, formatDistance, getCategoryLabel } from '@/data/locationsData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LocationCardProps {
  location: Location;
  distance?: number | null;
  onSelect: (location: Location) => void;
  onNavigate: (location: Location) => void;
}

const LocationCard = ({ location, distance, onSelect, onNavigate }: LocationCardProps) => {
  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'masjid':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'miqat':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'ziarah':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'landmark':
        return 'bg-secondary text-secondary-foreground border-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${getCategoryBadgeStyle(location.category)}`}
            >
              {getCategoryLabel(location.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">{location.city}</span>
          </div>
          
          <h3 className="font-semibold text-foreground truncate">{location.name}</h3>
          <p className="text-sm text-primary font-arabic">{location.nameArabic}</p>
          
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {location.description}
          </p>
          
          {distance !== null && distance !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-sm text-accent-foreground">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{formatDistance(distance)}</span>
              <span className="text-muted-foreground">dari lokasi Anda</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            onClick={() => onSelect(location)}
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9"
            onClick={() => onNavigate(location)}
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationCard;
