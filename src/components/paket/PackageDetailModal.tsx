import { useEffect, useState } from 'react';
import { X, Plane, Hotel, MessageCircle, Crown, Star, Send, FileText, ShoppingCart, MessagesSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageWithDetails, Departure } from '@/types/database';
import { Button } from '@/components/ui/button';
import { useTrackInterest } from '@/hooks/usePackageInterests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TravelReviewSection } from '@/components/reviews/TravelReviewSection';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { ChatView } from '@/components/chat/ChatView';
import { HajiRegistrationForm } from '@/components/haji/HajiRegistrationForm';
import { PackageType, packageTypeLabels, packageTypeColors } from '@/hooks/useHaji';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import BookingForm from '@/components/booking/BookingForm';

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

interface DepartureOptionProps {
  departure: Departure;
  isBestseller?: boolean;
  onSelect?: (departure: Departure) => void;
  isUmroh?: boolean;
}

const DepartureOption = ({ departure, isBestseller, onSelect, isUmroh }: DepartureOptionProps) => {
  const isAvailable = departure.status !== 'full';
  
  return (
    <motion.div
      whileHover={isAvailable ? { scale: 1.01 } : {}}
      whileTap={isAvailable ? { scale: 0.99 } : {}}
      onClick={() => isAvailable && isUmroh && onSelect?.(departure)}
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
      
      {isAvailable && isUmroh && (
        <Button 
          size="sm" 
          className="w-full mt-3 gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(departure);
          }}
        >
          <ShoppingCart className="h-3 w-3" />
          Booking Sekarang
        </Button>
      )}
    </motion.div>
  );
};

const PackageDetailModal = ({ package: pkg, onClose }: PackageDetailModalProps) => {
  const trackInterest = useTrackInterest();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('jadwal');
  const [showHajiForm, setShowHajiForm] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const isHajiPackage = pkg?.package_type && pkg.package_type !== 'umroh';
  const isUmrohPackage = pkg?.package_type === 'umroh';

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
      setShowHajiForm(false);
      setShowBookingForm(false);
      setSelectedDeparture(null);
    }
  }, [pkg?.id]);

  const handleDepartureSelect = (departure: Departure) => {
    setSelectedDeparture(departure);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedDeparture(null);
    onClose();
  };

  const handleBookingCancel = () => {
    setShowBookingForm(false);
    setSelectedDeparture(null);
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        />
        
        {/* Modal Content - Always Centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-card rounded-3xl 
                     max-h-[90vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-t-3xl sticky top-0 z-10 shrink-0">
            <h3 className="font-bold text-base sm:text-lg text-foreground pr-2 line-clamp-1">
              Pilih Jadwal Keberangkatan
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar min-h-0">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug line-clamp-2">
                {pkg.name} - {pkg.travel.name}
              </h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] sm:text-xs bg-blue-500/10 text-blue-600 px-2 sm:px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium flex items-center gap-1">
                  <Plane className="w-3 h-3" /> {pkg.airline || 'N/A'}
                </span>
                <span className="text-[10px] sm:text-xs bg-accent/10 text-accent px-2 sm:px-2.5 py-1 rounded-lg border border-accent/20 font-medium flex items-center gap-1">
                  <Hotel className="w-3 h-3" /> {pkg.hotel_makkah} *{pkg.hotel_star}
                </span>
              </div>
            </div>
            
            {showBookingForm && selectedDeparture && isUmrohPackage ? (
              <BookingForm
                package={pkg}
                departure={selectedDeparture}
                onSuccess={handleBookingSuccess}
                onCancel={handleBookingCancel}
              />
            ) : showHajiForm && isHajiPackage ? (
              <HajiRegistrationForm
                packageId={pkg.id}
                travelId={pkg.travel.id}
                packageName={pkg.name}
                packageType={pkg.package_type as PackageType}
                minDp={pkg.min_dp}
                onSuccess={() => {
                  setShowHajiForm(false);
                  onClose();
                }}
                onCancel={() => setShowHajiForm(false)}
              />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full mb-4 ${isHajiPackage ? 'grid-cols-5' : 'grid-cols-4'} h-auto`}>
                  <TabsTrigger value="jadwal" className="text-xs sm:text-sm py-2">
                    Jadwal
                  </TabsTrigger>
                  {isHajiPackage && (
                    <TabsTrigger value="daftar" className="text-xs sm:text-sm py-2 flex items-center gap-1">
                      <FileText className="h-3 w-3 hidden sm:block" />
                      Daftar
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="chat" className="text-xs sm:text-sm py-2 flex items-center gap-1">
                    <MessagesSquare className="h-3 w-3 hidden sm:block" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="inquiry" className="text-xs sm:text-sm py-2 flex items-center gap-1">
                    <Send className="h-3 w-3 hidden sm:block" />
                    Inquiry
                  </TabsTrigger>
                  <TabsTrigger value="review" className="text-xs sm:text-sm py-2 flex items-center gap-1">
                    <Star className="h-3 w-3 hidden sm:block" />
                    Review
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="jadwal" className="mt-0 space-y-3">
                  {isUmrohPackage && (
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs sm:text-sm text-foreground font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
                        <span>Pilih jadwal dan klik "Booking Sekarang"</span>
                      </p>
                    </div>
                  )}
                  {isHajiPackage && (
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={packageTypeColors[pkg.package_type as PackageType]}>
                          {packageTypeLabels[pkg.package_type as PackageType]}
                        </Badge>
                        {pkg.estimated_departure_year && (
                          <span className="text-xs text-muted-foreground">
                            Est. {pkg.estimated_departure_year}
                          </span>
                        )}
                      </div>
                      {pkg.min_dp && pkg.min_dp > 0 && (
                        <p className="text-sm text-foreground">
                          DP Minimal: <span className="font-bold text-primary">Rp {pkg.min_dp.toLocaleString('id-ID')}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {pkg.departures.length > 0 ? (
                    pkg.departures.map((departure, index) => (
                      <DepartureOption
                        key={departure.id}
                        departure={departure}
                        isBestseller={index === 0}
                        onSelect={handleDepartureSelect}
                        isUmroh={isUmrohPackage}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {isHajiPackage ? 'Jadwal keberangkatan akan diumumkan' : 'Belum ada jadwal keberangkatan'}
                    </p>
                  )}
                </TabsContent>

                {isHajiPackage && (
                  <TabsContent value="daftar" className="mt-0">
                    {user ? (
                      <div className="text-center py-6 space-y-4">
                        <FileText className="w-12 h-12 text-primary mx-auto" />
                        <h3 className="font-semibold text-foreground">Pendaftaran Haji</h3>
                        <p className="text-sm text-muted-foreground px-4">
                          Daftar sekarang untuk paket {packageTypeLabels[pkg.package_type as PackageType]}
                        </p>
                        <Button onClick={() => setShowHajiForm(true)} className="w-full max-w-xs">
                          Mulai Pendaftaran
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                        <h3 className="font-semibold text-foreground">Login Diperlukan</h3>
                        <p className="text-sm text-muted-foreground px-4">
                          Silakan login terlebih dahulu untuk mendaftar paket haji
                        </p>
                        <Button variant="outline" asChild>
                          <a href="/auth">Masuk / Daftar</a>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="chat" className="mt-0">
                  {user ? (
                    <div className="h-[350px]">
                      <ChatView
                        bookingId={null}
                        travelId={pkg.travel.id}
                        travelName={pkg.travel.name}
                        senderType="jamaah"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <MessagesSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="font-semibold">Login untuk Chat</h3>
                      <p className="text-sm text-muted-foreground">Masuk untuk mengirim pesan langsung ke agen travel</p>
                      <Button variant="outline" asChild><a href="/auth">Masuk / Daftar</a></Button>
                    </div>
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
            )}
          </div>
          
          {/* Footer CTA - Always visible */}
          <div className="p-3 sm:p-4 border-t border-border bg-card shadow-float shrink-0 safe-area-bottom">
            <Button 
              asChild
              className="w-full shadow-primary gap-2 text-sm sm:text-base" 
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
