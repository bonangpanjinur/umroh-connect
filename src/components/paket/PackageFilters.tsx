import { useState } from 'react';
import { X, SlidersHorizontal, Star, Plane, Calendar, DollarSign, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { PackageFilters as FilterType, PackageType } from '@/types/database';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface PackageFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

const months = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Agu' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Okt' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Des' },
];

const packageTypes: { value: 'all' | PackageType; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'umroh', label: 'Umroh' },
  { value: 'haji_reguler', label: 'Haji Reguler' },
  { value: 'haji_plus', label: 'Haji Plus' },
  { value: 'haji_furoda', label: 'Haji Furoda' },
];

export const PackageFiltersSheet = ({ filters, onFiltersChange }: PackageFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterType = {
      search: filters.search,
      minPrice: null,
      maxPrice: null,
      months: [],
      hotelStars: [],
      flightType: 'all',
      duration: 'all',
      packageType: 'all',
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleMonth = (month: number) => {
    setLocalFilters(prev => ({
      ...prev,
      months: prev.months.includes(month)
        ? prev.months.filter(m => m !== month)
        : [...prev.months, month],
    }));
  };

  const toggleStar = (star: number) => {
    setLocalFilters(prev => ({
      ...prev,
      hotelStars: prev.hotelStars.includes(star)
        ? prev.hotelStars.filter(s => s !== star)
        : [...prev.hotelStars, star],
    }));
  };

  const activeFiltersCount = [
    filters.minPrice !== null || filters.maxPrice !== null,
    filters.months.length > 0,
    filters.hotelStars.length > 0,
    filters.flightType !== 'all',
    filters.duration !== 'all',
    filters.packageType !== 'all',
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative bg-secondary w-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center justify-between">
            Filter Paket
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-24 hide-scrollbar">
          {/* Price Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Rentang Harga
            </Label>
            <div className="px-2">
              <Slider
                value={[localFilters.minPrice || 15000000, localFilters.maxPrice || 50000000]}
                min={15000000}
                max={100000000}
                step={1000000}
                onValueChange={([min, max]) => {
                  setLocalFilters(prev => ({
                    ...prev,
                    minPrice: min,
                    maxPrice: max,
                  }));
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Rp {((localFilters.minPrice || 15000000) / 1000000).toFixed(0)} Jt</span>
                <span>Rp {((localFilters.maxPrice || 50000000) / 1000000).toFixed(0)} Jt</span>
              </div>
            </div>
          </div>

          {/* Month Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bulan Keberangkatan
            </Label>
            <div className="flex flex-wrap gap-2">
              {months.map((month) => (
                <button
                  key={month.value}
                  onClick={() => toggleMonth(month.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    localFilters.months.includes(month.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hotel Stars */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Bintang Hotel
            </Label>
            <div className="flex gap-2">
              {[3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => toggleStar(star)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.hotelStars.includes(star)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  {star}
                </button>
              ))}
            </div>
          </div>

          {/* Flight Type */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Jenis Penerbangan
            </Label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'direct', label: 'Direct' },
                { value: 'transit', label: 'Transit' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setLocalFilters(prev => ({ ...prev, flightType: type.value as any }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.flightType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label>Durasi Perjalanan</Label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'short', label: '< 9 hari' },
                { value: 'medium', label: '9-12 hari' },
                { value: 'long', label: '> 12 hari' },
              ].map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setLocalFilters(prev => ({ ...prev, duration: dur.value as any }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    localFilters.duration === dur.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Package Type */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Tipe Paket
            </Label>
            <div className="flex flex-wrap gap-2">
              {packageTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setLocalFilters(prev => ({ ...prev, packageType: type.value }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.packageType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <Button onClick={handleApply} className="w-full" size="lg">
            Terapkan Filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Quick filter tags
interface QuickFilterTagsProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export const QuickFilterTags = ({ filters, onFiltersChange }: QuickFilterTagsProps) => {
  const quickFilters = [
    { 
      id: 'all', 
      label: 'Semua',
      isActive: () => filters.months.length === 0 && filters.hotelStars.length === 0 && filters.maxPrice === null && filters.packageType === 'all',
      apply: () => onFiltersChange({ ...filters, months: [], hotelStars: [], minPrice: null, maxPrice: null, packageType: 'all' }),
    },
    { 
      id: 'umroh', 
      label: '🕋 Umroh',
      isActive: () => filters.packageType === 'umroh',
      apply: () => onFiltersChange({ ...filters, packageType: filters.packageType === 'umroh' ? 'all' : 'umroh' }),
    },
    { 
      id: 'haji', 
      label: '🏕️ Haji',
      isActive: () => filters.packageType === 'haji_reguler' || filters.packageType === 'haji_plus' || filters.packageType === 'haji_furoda',
      apply: () => onFiltersChange({ ...filters, packageType: filters.packageType.startsWith('haji') ? 'all' : 'haji_reguler' }),
    },
    { 
      id: 'price25', 
      label: '< Rp 25Jt',
      isActive: () => filters.maxPrice === 25000000,
      apply: () => onFiltersChange({ ...filters, minPrice: null, maxPrice: filters.maxPrice === 25000000 ? null : 25000000 }),
    },
    { 
      id: 'star5', 
      label: 'Bintang 5',
      isActive: () => filters.hotelStars.includes(5),
      apply: () => onFiltersChange({ 
        ...filters, 
        hotelStars: filters.hotelStars.includes(5) 
          ? filters.hotelStars.filter(s => s !== 5)
          : [...filters.hotelStars, 5]
      }),
    },
    { 
      id: 'direct', 
      label: 'Direct Flight',
      isActive: () => filters.flightType === 'direct',
      apply: () => onFiltersChange({ ...filters, flightType: filters.flightType === 'direct' ? 'all' : 'direct' }),
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
      {quickFilters.map((tag) => (
        <button
          key={tag.id}
          onClick={tag.apply}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            tag.isActive()
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
};
