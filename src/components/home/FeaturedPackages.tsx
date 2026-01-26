import { motion } from 'framer-motion';
import { Star, Sparkles, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFeaturedPackagesDisplay } from '@/hooks/useFeaturedPackages';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface FeaturedPackagesProps {
  onPackageClick?: (packageId: string) => void;
}

export const FeaturedPackages = ({ onPackageClick }: FeaturedPackagesProps) => {
  const { data: featuredPackages, isLoading } = useFeaturedPackagesDisplay('home');

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold">Paket Unggulan</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[280px] h-[180px] bg-secondary animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!featuredPackages || featuredPackages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold">Paket Unggulan</h3>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
          Pilihan Terbaik
        </Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {featuredPackages.map((featured, index) => {
          const pkg = featured.package;
          if (!pkg) return null;

          const lowestPrice = pkg.departures?.reduce((min, dep) => 
            dep.price < min ? dep.price : min, 
            pkg.departures[0]?.price || 0
          );

          const nextDeparture = pkg.departures?.find(dep => 
            new Date(dep.departure_date) > new Date()
          );

          return (
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onPackageClick?.(pkg.id)}
              className="min-w-[280px] relative overflow-hidden rounded-2xl cursor-pointer group"
            >
              {/* Background Image */}
              <div className="aspect-[16/10] relative">
                <img
                  src={pkg.images?.[0] || '/placeholder.svg'}
                  alt={pkg.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Featured Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>

                {/* Travel Logo */}
                {pkg.travel?.logo_url && (
                  <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-lg overflow-hidden">
                    <img 
                      src={pkg.travel.logo_url} 
                      alt={pkg.travel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h4 className="font-bold text-lg line-clamp-1 mb-1">{pkg.name}</h4>
                  
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                    <span>{pkg.duration_days} Hari</span>
                    {pkg.travel && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{pkg.travel.name}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {lowestPrice && (
                        <p className="text-amber-400 font-bold text-lg">
                          Rp {lowestPrice.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                    
                    {nextDeparture && (
                      <div className="flex items-center gap-1 text-xs text-white/70">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(nextDeparture.departure_date), 'dd MMM', { locale: localeId })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
