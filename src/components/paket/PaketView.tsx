import { useState, useMemo } from 'react';
import { Search, X, Sparkles, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackages } from '@/hooks/usePackages';
import { PackageWithDetails, PackageFilters as FilterType } from '@/types/database';
import PackageCard from './PackageCard';
import PackageDetailModal from './PackageDetailModal';
import { PackageFiltersSheet, QuickFilterTags } from './PackageFilters';
import { mockPackages } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import AIRecommendationWizard from '@/components/recommendation/AIRecommendationWizard';

interface PaketViewProps {
  initialPackageId?: string | null;
}

const PaketView = ({ initialPackageId }: PaketViewProps) => {
  const [filters, setFilters] = useState<FilterType>({
    search: '',
    minPrice: null,
    maxPrice: null,
    months: [],
    hotelStars: [],
    flightType: 'all',
    duration: 'all',
    packageType: 'all',
  });
  const [selectedPackage, setSelectedPackage] = useState<PackageWithDetails | null>(null);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'departure_nearest'>('default');
  
  const { data: packages, isLoading, error } = usePackages();

  // Use mock data if no packages from DB yet
  const displayPackages: PackageWithDetails[] = packages && packages.length > 0 
    ? packages 
    : mockPackages.map(pkg => ({
        id: pkg.id,
        travel_id: pkg.travel.id,
        name: pkg.name,
        description: pkg.description,
        duration_days: pkg.duration,
        hotel_makkah: pkg.hotelMakkah,
        hotel_madinah: pkg.hotelMadinah,
        hotel_star: pkg.hotelStar,
        airline: pkg.airline,
        flight_type: pkg.flightType as 'direct' | 'transit',
        meal_type: pkg.mealType as 'fullboard' | 'halfboard' | 'breakfast',
        facilities: pkg.facilities,
        images: pkg.images,
        is_active: true,
        package_type: 'umroh' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        travel: {
          id: pkg.travel.id,
          owner_id: '',
          name: pkg.travel.name,
          description: null,
          logo_url: pkg.travel.logo || null,
          address: null,
          phone: null,
          whatsapp: null,
          email: null,
          rating: pkg.travel.rating,
          review_count: pkg.travel.reviewCount,
          verified: pkg.travel.verified,
          verified_at: null,
          verified_by: null,
          approval_notes: null,
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        departures: pkg.departures.map(d => ({
          id: d.id,
          package_id: d.packageId,
          departure_date: d.departureDate,
          return_date: d.returnDate,
          price: d.price,
          original_price: d.originalPrice || null,
          available_seats: d.availableSeats,
          total_seats: d.totalSeats,
          status: d.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      }));

  // Apply all filters
  const filteredPackages = useMemo(() => {
    let result = displayPackages.filter(pkg => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesSearch = 
          pkg.name.toLowerCase().includes(query) ||
          pkg.travel.name.toLowerCase().includes(query) ||
          pkg.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Price filter (based on departures)
      if (filters.minPrice !== null || filters.maxPrice !== null) {
        const lowestPrice = pkg.departures.length > 0 
          ? Math.min(...pkg.departures.map(d => d.price))
          : 0;
        
        if (filters.minPrice !== null && lowestPrice < filters.minPrice) return false;
        if (filters.maxPrice !== null && lowestPrice > filters.maxPrice) return false;
      }

      // Month filter
      if (filters.months.length > 0) {
        const hasMatchingDeparture = pkg.departures.some(d => {
          const departureMonth = new Date(d.departure_date).getMonth() + 1;
          return filters.months.includes(departureMonth);
        });
        if (!hasMatchingDeparture) return false;
      }

      // Hotel star filter
      if (filters.hotelStars.length > 0) {
        if (!filters.hotelStars.includes(pkg.hotel_star)) return false;
      }

      // Flight type filter
      if (filters.flightType !== 'all') {
        if (pkg.flight_type !== filters.flightType) return false;
      }

      // Duration filter
      if (filters.duration !== 'all') {
        switch (filters.duration) {
          case 'short':
            if (pkg.duration_days >= 9) return false;
            break;
          case 'medium':
            if (pkg.duration_days < 9 || pkg.duration_days > 12) return false;
            break;
          case 'long':
            if (pkg.duration_days <= 12) return false;
            break;
        }
      }

      // Package type filter
      if (filters.packageType !== 'all') {
        if (pkg.package_type !== filters.packageType) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        const getLowestPrice = (pkg: PackageWithDetails) =>
          pkg.departures.length > 0 ? Math.min(...pkg.departures.map(d => d.price)) : 0;
        const getNearestDeparture = (pkg: PackageWithDetails) => {
          const future = pkg.departures
            .map(d => new Date(d.departure_date).getTime())
            .filter(t => t > Date.now());
          return future.length > 0 ? Math.min(...future) : Infinity;
        };

        switch (sortBy) {
          case 'price_asc': return getLowestPrice(a) - getLowestPrice(b);
          case 'price_desc': return getLowestPrice(b) - getLowestPrice(a);
          case 'departure_nearest': return getNearestDeparture(a) - getNearestDeparture(b);
          default: return 0;
        }
      });
    }

    return result;
  }, [displayPackages, filters, sortBy]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Search Header */}
      <div className="bg-card px-4 py-3 sticky top-14 z-30 shadow-sm border-b border-border">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari paket / travel..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <PackageFiltersSheet filters={filters} onFiltersChange={setFilters} />
        </div>
        
        {/* Quick Filter Tags + Sort */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-hidden">
            <QuickFilterTags filters={filters} onFiltersChange={setFilters} />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 text-muted-foreground flex-shrink-0"
          >
            <option value="default">Urutkan</option>
            <option value="price_asc">Harga ↑</option>
            <option value="price_desc">Harga ↓</option>
            <option value="departure_nearest">Terdekat</option>
          </select>
        </div>
      </div>

      {/* AI Recommendation CTA */}
      <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-primary/20">
        <Button 
          onClick={() => setShowAIWizard(true)}
          className="w-full gap-2 shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          Rekomendasi AI - Temukan Paket Ideal
        </Button>
      </div>
      
      {/* Package List */}
      <div className="p-4 space-y-4 pb-24 bg-secondary/30 min-h-screen">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <AnimatePresence>
            {filteredPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PackageCard
                  package={pkg}
                  onClick={() => setSelectedPackage(pkg)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {!isLoading && filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada paket ditemukan</p>
            {(filters.months.length > 0 || filters.hotelStars.length > 0 || filters.maxPrice !== null) && (
              <button 
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  months: [], 
                  hotelStars: [], 
                  minPrice: null, 
                  maxPrice: null,
                  flightType: 'all',
                  duration: 'all',
                }))}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Package Detail Modal */}
      <PackageDetailModal
        package={selectedPackage}
        onClose={() => setSelectedPackage(null)}
      />

      {/* AI Recommendation Wizard */}
      <AnimatePresence>
        {showAIWizard && (
          <AIRecommendationWizard 
            onClose={() => setShowAIWizard(false)}
            onSelectPackage={(pkg) => {
              setShowAIWizard(false);
              setSelectedPackage(pkg);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaketView;
