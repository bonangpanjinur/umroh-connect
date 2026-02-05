import { usePackages } from '@/hooks/usePackages';
import { PackagesBlockContent } from '@/types/blocks';
import { Loader2 } from 'lucide-react';

interface DynamicPackagesProps {
  content: PackagesBlockContent;
}

export function DynamicPackages({ content }: DynamicPackagesProps) {
  const { data: packages, isLoading, error } = usePackages();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat paket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Gagal memuat paket.
      </div>
    );
  }

  const displayPackages = packages?.slice(0, content.limit || 6) || [];
  const cols = content.columns || 3;
  const colClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' : cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className={`grid ${colClass} gap-8`}>
      {displayPackages.map((pkg) => (
        <div key={pkg.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white">
          <div className="aspect-video bg-gray-100 relative">
            {pkg.images && pkg.images[0] ? (
              <img src={pkg.images[0]} alt={pkg.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            <div className="absolute top-2 right-2">
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                {pkg.package_type || 'Umroh'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-1 line-clamp-1">{pkg.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div>
                {content.showPrice && pkg.departures && pkg.departures.length > 0 && (
                  <p className="text-primary font-bold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.min(...pkg.departures.map(d => d.price)))}
                  </p>
                )}
                {content.showRating && pkg.travel && (
                  <div className="flex items-center text-yellow-400 text-xs mt-1">
                    ★★★★★ <span className="text-muted-foreground ml-1">({pkg.travel.review_count || 0})</span>
                  </div>
                )}
              </div>
              <button className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-colors">
                Detail
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
