import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportantLocation {
  id: string;
  name: string;
  name_arabic: string | null;
  category: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  opening_hours: string | null;
  priority: number;
  is_active: boolean;
}

export type LocationCategory = 'masjid' | 'miqat' | 'ziarah' | 'landmark' | 'hotel' | 'hospital' | 'embassy' | 'shopping';

export const useImportantLocations = (city?: string, category?: string) => {
  return useQuery({
    queryKey: ['important-locations', city, category],
    queryFn: async () => {
      let query = supabase
        .from('important_locations')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (city && city !== 'all') {
        query = query.eq('city', city);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ImportantLocation[];
    },
  });
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

// Get category label in Indonesian
export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    masjid: 'Masjid',
    miqat: 'Miqat',
    ziarah: 'Ziarah',
    landmark: 'Landmark',
    hotel: 'Hotel',
    hospital: 'Rumah Sakit',
    embassy: 'Kedutaan',
    shopping: 'Belanja',
  };
  return labels[category] || category;
};

// Get category color
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    masjid: 'hsl(var(--primary))',
    miqat: 'hsl(var(--accent))',
    ziarah: 'hsl(142, 76%, 36%)',
    landmark: 'hsl(var(--secondary-foreground))',
    hotel: 'hsl(221, 83%, 53%)',
    hospital: 'hsl(0, 84%, 60%)',
    embassy: 'hsl(262, 83%, 58%)',
    shopping: 'hsl(45, 93%, 47%)',
  };
  return colors[category] || 'hsl(var(--muted-foreground))';
};
