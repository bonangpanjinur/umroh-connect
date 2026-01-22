import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackages } from '@/hooks/usePackages';
import { PackageWithDetails } from '@/types/database';
import PackageCard from './PackageCard';
import PackageDetailModal from './PackageDetailModal';
import { mockPackages } from '@/data/mockData';

const filterTags = [
  { id: 'all', label: 'Semua' },
  { id: 'feb', label: 'Bulan Feb' },
  { id: 'price', label: '< Rp 25Jt' },
  { id: 'star5', label: 'Bintang 5' },
];

const PaketView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<PackageWithDetails | null>(null);
  
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

  const filteredPackages = displayPackages.filter(pkg => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        pkg.name.toLowerCase().includes(query) ||
        pkg.travel.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button className="bg-secondary w-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        {/* Filter Tags */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {filterTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveFilter(tag.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tag.id
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
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
          </div>
        )}
      </div>
      
      {/* Package Detail Modal */}
      <PackageDetailModal
        package={selectedPackage}
        onClose={() => setSelectedPackage(null)}
      />
    </motion.div>
  );
};

export default PaketView;
