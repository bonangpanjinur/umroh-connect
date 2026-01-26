import { Star, Hotel, Plane, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { PackageWithDetails } from '@/types/database';
import { Button } from '@/components/ui/button';
import { PackageTypeBadge } from '@/components/haji/PackageTypeBadge';

interface PackageCardProps {
  package: PackageWithDetails;
  onClick: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const PackageCard = ({ package: pkg, onClick }: PackageCardProps) => {
  const lowestPrice = pkg.departures.length > 0 
    ? Math.min(...pkg.departures.map(d => d.price))
    : 0;
  const availableDepartures = pkg.departures.filter(d => d.status !== 'full').length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-card rounded-2xl shadow-card border border-border overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
    >
      {/* Image Header */}
      <div className="relative h-40">
        <img
          src={pkg.images[0] || 'https://images.unsplash.com/photo-1565552629477-087529670247?w=800'}
          alt={pkg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {pkg.package_type && pkg.package_type !== 'umroh' && (
            <PackageTypeBadge type={pkg.package_type} />
          )}
          <span className="bg-card/95 backdrop-blur-sm text-foreground text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-accent text-accent" />
            {pkg.travel.rating} ({pkg.travel.review_count})
          </span>
        </div>
        
        {/* Travel Name Overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-foreground/90 to-transparent p-3">
          <p className="text-primary-foreground text-xs font-medium flex items-center gap-1.5">
            <Hotel className="w-3 h-3" /> {pkg.travel.name}
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-foreground leading-tight flex-1 pr-2">
            {pkg.name}
          </h3>
          <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
            availableDepartures > 0
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {availableDepartures > 0 ? 'AVAILABLE' : 'FULL'}
          </div>
        </div>
        
        {/* Facilities Icons */}
        <div className="flex gap-4 text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
          <span className="flex items-center gap-1">
            <Hotel className="w-3.5 h-3.5 text-accent" /> *{pkg.hotel_star}
          </span>
          <span className="flex items-center gap-1">
            <Plane className={`w-3.5 h-3.5 ${pkg.flight_type === 'direct' ? 'text-blue-500' : 'text-muted-foreground'}`} />
            {pkg.flight_type === 'direct' ? 'Direct' : 'Transit'}
          </span>
          <span className="flex items-center gap-1">
            <UtensilsCrossed className="w-3.5 h-3.5 text-accent" />
            {pkg.meal_type === 'fullboard' ? 'Fullboard' : pkg.meal_type === 'halfboard' ? 'Halfboard' : 'Breakfast'}
          </span>
        </div>
        
        {/* Pricing & CTA */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Mulai dari</p>
            <p className="text-lg font-bold text-accent">
              {lowestPrice > 0 ? formatPrice(lowestPrice) : '-'}
            </p>
          </div>
          <Button size="sm" className="shadow-primary gap-1">
            Lihat {pkg.departures.length} Tanggal
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PackageCard;
