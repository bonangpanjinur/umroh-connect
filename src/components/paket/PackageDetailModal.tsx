import { useEffect, useState } from 'react';
import { X, Plane, Hotel, MessageCircle, Crown, Star, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageWithDetails, Departure } from '@/types/database';
import { Button } from '@/components/ui/button';
import { useTrackInterest } from '@/hooks/usePackageInterests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TravelReviewSection } from '@/components/reviews/TravelReviewSection';
import { InquiryForm } from '@/components/inquiry/InquiryForm';

interface PackageDetailModalProps {
  package: PackageWithDetails | null;
  onClose: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const DepartureOption = ({ departure, isBestseller }: { departure: Departure; isBestseller?: boolean }) => {
  const isAvailable = departure.status !== 'full';
  
  return (
    <motion.div
      whileHover={isAvailable ? { scale: 1.01 } : {}}
      whileTap={isAvailable ? { scale: 0.99 } : {}}
      className={`border p-4 rounded-2xl relative cursor-pointer transition-all ${
        isBestseller
          ? 'border-primary bg-primary/5'
          : isAvailable
          ? 'border-border hover:border-primary/50'
          : 'border-border opacity-60'
      }`}
    >
      {isBestseller && (
        <div className="absolute -top-px -right-px bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
          <Crown className="w-3 h-3" /> Terlaris
        </div>
      )}
      
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-foreground">
          {formatDate(departure.departure_date)}
        </span>
        {departure.status === 'full' && (
          <span className="text-[10px] text-destructive font-bold border border-destructive/30 px-1.5 py-0.5 rounded">
            FULL BOOKED
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-end">
        <div className="text-xs text-muted-foreground">
          {departure.status === 'full' 
            ? 'Waitlist Available'
            : `Sisa ${departure.available_seats} Seat`}
        </div>
        <div className="text-right">
          {departure.original_price && (
            <span className="block text-xs text-muted-foreground line-through">
              {formatPrice(departure.original_price)}
            </span>
          )}
          <span className={`text-lg font-bold ${isAvailable ? 'text-accent' : 'text-muted-foreground'}`}>
            {formatPrice(departure.price)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const PackageDetailModal = ({ package: pkg, onClose }: PackageDetailModalProps) => {
  const trackInterest = useTrackInterest();
  const [activeTab, setActiveTab] = useState('jadwal');

  // Track view when modal opens
  useEffect(() => {
    if (pkg) {
      trackInterest.mutate({ 
        packageId: pkg.id, 
        interestType: 'view' 
      });
    }
  }, [pkg?.id]);

  // Reset tab when modal opens
  useEffect(() => {
    if (pkg) {
      setActiveTab('jadwal');
    }
  }, [pkg?.id]);

  if (!pkg) return null;

  const handleWhatsAppClick = () => {
    // Track WhatsApp click
    trackInterest.mutate({ 
      packageId: pkg.id, 
      interestType: 'whatsapp_click' 
    });
  };

  const whatsappUrl = pkg.travel.whatsapp 
    ? `https://wa.me/${pkg.travel.whatsapp.replace(/\D/g, '')}?text=Halo, saya tertarik dengan ${pkg.name}`
    : '#';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-t-3xl sticky top-0 z-10">
            <h3 className="font-bold text-lg text-foreground">Pilih Jadwal Keberangkatan</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground leading-snug">
                {pkg.name} - {pkg.travel.name}
              </h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium flex items-center gap-1">
                  <Plane className="w-3 h-3" /> {pkg.airline || 'N/A'}
                </span>
                <span className="text-[10px] bg-accent/10 text-accent px-2.5 py-1 rounded-lg border border-accent/20 font-medium flex items-center gap-1">
                  <Hotel className="w-3 h-3" /> {pkg.hotel_makkah} *{pkg.hotel_star}
                </span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="jadwal" className="text-sm">
                  Jadwal
                </TabsTrigger>
                <TabsTrigger value="inquiry" className="text-sm flex items-center gap-1">
                  <Send className="h-3 w-3" />
                  Inquiry
                </TabsTrigger>
                <TabsTrigger value="review" className="text-sm flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Review
                </TabsTrigger>
              </TabsList>

              <TabsContent value="jadwal" className="mt-0 space-y-3">
                {pkg.departures.length > 0 ? (
                  pkg.departures.map((departure, index) => (
                    <DepartureOption
                      key={departure.id}
                      departure={departure}
                      isBestseller={index === 0}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada jadwal keberangkatan
                  </p>
                )}
              </TabsContent>

              <TabsContent value="inquiry" className="mt-0">
                <InquiryForm 
                  package={pkg}
                  onSuccess={() => setActiveTab('jadwal')}
                />
              </TabsContent>

              <TabsContent value="review" className="mt-0">
                <TravelReviewSection 
                  travelId={pkg.travel.id} 
                  travelName={pkg.travel.name} 
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Footer CTA */}
          <div className="p-4 border-t border-border bg-card shadow-float">
            <Button 
              asChild
              className="w-full shadow-primary gap-2" 
              size="lg"
              onClick={handleWhatsAppClick}
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                Chat Agen Sekarang (WA)
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PackageDetailModal;
