import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: string;
  is_active: boolean;
}

const PromoBanner = () => {
  // Fetch active home banners from database
  const { data: banners, isLoading } = useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('position', 'home')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as Banner[];
    },
    staleTime: 60000,
  });

  // Autoplay carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Don't render if no banners or loading
  if (isLoading) {
    return (
      <div className="px-4 mb-4">
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null; // Hide banner section entirely if no active banners
  }

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank');
    }
  };

  return (
    <div className="px-4 mb-4 relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-[0_0_100%] min-w-0 h-32 rounded-2xl relative overflow-hidden cursor-pointer group"
              onClick={() => handleBannerClick(banner)}
            >
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent flex items-end p-4">
                <h3 className="text-primary-foreground font-bold text-sm leading-tight">
                  {banner.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === selectedIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBanner;