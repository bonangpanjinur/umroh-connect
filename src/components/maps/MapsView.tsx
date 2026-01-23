import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, List, Map, Filter, Search, Locate, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { locationsData, Location, LocationCategory, calculateDistance, getCategoryLabel } from '@/data/locationsData';
import { useGeolocation } from '@/hooks/useGeolocation';
import LocationCard from './LocationCard';
import LocationDetail from './LocationDetail';
import MapDisplay from './MapDisplay';

interface MapsViewProps {
  onBack: () => void;
}

type ViewMode = 'list' | 'map';
type CityFilter = 'all' | 'Makkah' | 'Madinah';

const MapsView = ({ onBack }: MapsViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCity, setSelectedCity] = useState<CityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const { latitude, longitude, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  
  const userLocation = latitude && longitude ? { latitude, longitude } : null;

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = locationsData;

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(loc => loc.city === selectedCity);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(loc => loc.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        loc =>
          loc.name.toLowerCase().includes(query) ||
          loc.nameArabic.includes(query) ||
          loc.description.toLowerCase().includes(query)
      );
    }

    // Add distance and sort
    const withDistance = filtered.map(loc => ({
      ...loc,
      distance: userLocation
        ? calculateDistance(userLocation.latitude, userLocation.longitude, loc.latitude, loc.longitude)
        : null
    }));

    // Sort by distance if available
    if (userLocation) {
      withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return withDistance;
  }, [locationsData, selectedCity, selectedCategory, searchQuery, userLocation]);

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setShowDetail(true);
  };

  const handleNavigateToLocation = (location: Location) => {
    setSelectedLocation(location);
    setViewMode('map');
    setShowDetail(false);
  };

  const categories: (LocationCategory | 'all')[] = ['all', 'masjid', 'miqat', 'ziarah', 'landmark'];

  if (showDetail && selectedLocation) {
    return (
      <LocationDetail
        location={selectedLocation}
        distance={
          userLocation
            ? calculateDistance(userLocation.latitude, userLocation.longitude, selectedLocation.latitude, selectedLocation.longitude)
            : null
        }
        onBack={() => setShowDetail(false)}
        onNavigate={handleNavigateToLocation}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Lokasi Penting</h1>
            <p className="text-sm text-muted-foreground">Makkah & Madinah</p>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('map')}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* City Filter */}
        <div className="px-4 pb-3">
          <Tabs value={selectedCity} onValueChange={(v) => setSelectedCity(v as CityFilter)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Semua</TabsTrigger>
              <TabsTrigger value="Makkah" className="flex-1">Makkah</TabsTrigger>
              <TabsTrigger value="Madinah" className="flex-1">Madinah</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Category Filter */}
        <div className="px-4 pb-3 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'Semua' : getCategoryLabel(cat)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Location Status */}
      {geoError && (
        <div className="px-4 pt-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{geoError}</span>
              <Button variant="outline" size="sm" onClick={requestLocation}>
                <Locate className="w-4 h-4 mr-1" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3 pb-20"
            >
              {/* Location Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredLocations.length} lokasi ditemukan
                </p>
                {!userLocation && !geoLoading && (
                  <Button variant="ghost" size="sm" onClick={requestLocation}>
                    <Locate className="w-4 h-4 mr-1" />
                    Aktifkan GPS
                  </Button>
                )}
              </div>

              {/* Location Cards */}
              {filteredLocations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  distance={location.distance}
                  onSelect={handleSelectLocation}
                  onNavigate={handleNavigateToLocation}
                />
              ))}

              {filteredLocations.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Tidak ada lokasi ditemukan</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <MapDisplay
                locations={filteredLocations}
                userLocation={userLocation}
                selectedLocation={selectedLocation}
                onLocationSelect={handleSelectLocation}
              />
              
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Lokasi Anda</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Masjid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-xs text-muted-foreground">Miqat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-xs text-muted-foreground">Ziarah</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MapsView;
