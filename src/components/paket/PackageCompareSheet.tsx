import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Hotel, Plane, UtensilsCrossed, X } from 'lucide-react';
import { PackageWithDetails } from '@/types/database';

interface PackageCompareSheetProps {
  packages: PackageWithDetails[];
  open: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const PackageCompareSheet = ({ packages, open, onClose, onRemove }: PackageCompareSheetProps) => {
  if (packages.length === 0) return null;

  const getLowestPrice = (pkg: PackageWithDetails) =>
    pkg.departures.length > 0 ? Math.min(...pkg.departures.map(d => d.price)) : 0;

  const rows: { label: string; render: (pkg: PackageWithDetails) => React.ReactNode }[] = [
    {
      label: 'Travel',
      render: (pkg) => (
        <div className="text-xs font-medium text-foreground">{pkg.travel.name}</div>
      ),
    },
    {
      label: 'Harga Mulai',
      render: (pkg) => {
        const price = getLowestPrice(pkg);
        return <span className="text-xs font-bold text-primary">{price > 0 ? formatPrice(price) : '-'}</span>;
      },
    },
    {
      label: 'Durasi',
      render: (pkg) => <span className="text-xs">{pkg.duration_days} hari</span>,
    },
    {
      label: 'Hotel',
      render: (pkg) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1">
            <Hotel className="w-3 h-3 text-muted-foreground" />
            <Star className="w-2.5 h-2.5 fill-accent text-accent" />
            {pkg.hotel_star}
          </div>
          {pkg.hotel_makkah && <p className="text-muted-foreground truncate">Makkah: {pkg.hotel_makkah}</p>}
          {pkg.hotel_madinah && <p className="text-muted-foreground truncate">Madinah: {pkg.hotel_madinah}</p>}
        </div>
      ),
    },
    {
      label: 'Penerbangan',
      render: (pkg) => (
        <span className="text-xs flex items-center gap-1">
          <Plane className="w-3 h-3" />
          {pkg.flight_type === 'direct' ? 'Direct' : 'Transit'}
        </span>
      ),
    },
    {
      label: 'Makan',
      render: (pkg) => (
        <span className="text-xs flex items-center gap-1">
          <UtensilsCrossed className="w-3 h-3" />
          {pkg.meal_type === 'fullboard' ? 'Fullboard' : pkg.meal_type === 'halfboard' ? 'Halfboard' : 'Breakfast'}
        </span>
      ),
    },
    {
      label: 'Maskapai',
      render: (pkg) => <span className="text-xs">{pkg.airline || '-'}</span>,
    },
    {
      label: 'Jadwal',
      render: (pkg) => (
        <span className="text-xs">{pkg.departures.filter(d => d.status !== 'full').length} tersedia</span>
      ),
    },
    {
      label: 'Rating',
      render: (pkg) => (
        <span className="text-xs flex items-center gap-1">
          <Star className="w-3 h-3 fill-accent text-accent" />
          {pkg.travel.rating} ({pkg.travel.review_count})
        </span>
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] overflow-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-base">Bandingkan Paket ({packages.length})</SheetTitle>
        </SheetHeader>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr>
                <th className="text-left text-[10px] text-muted-foreground font-medium p-2 w-20 sticky left-0 bg-background"></th>
                {packages.map(pkg => (
                  <th key={pkg.id} className="p-2 text-left min-w-[140px]">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-foreground line-clamp-2">{pkg.name}</span>
                      <button
                        onClick={() => onRemove(pkg.id)}
                        className="shrink-0 p-0.5 rounded-full hover:bg-muted"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.label} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="p-2 text-[10px] font-medium text-muted-foreground sticky left-0 bg-inherit whitespace-nowrap">
                    {row.label}
                  </td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="p-2">
                      {row.render(pkg)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PackageCompareSheet;
