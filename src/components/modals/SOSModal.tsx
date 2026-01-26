import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Phone, Hospital, X, Loader2, Navigation, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const SOSModal = ({ isOpen, onClose }: SOSModalProps) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current location when modal opens
  useEffect(() => {
    if (isOpen && !location) {
      getCurrentLocation();
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser Anda');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Aktifkan GPS Anda.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage = 'Permintaan lokasi timeout';
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const shareLocationToWhatsApp = (recipientType: 'muthawif' | 'ketua') => {
    if (!location) {
      toast({
        title: "Lokasi belum tersedia",
        description: "Tunggu hingga GPS mendapatkan lokasi Anda",
        variant: "destructive",
      });
      return;
    }

    const { latitude, longitude } = location;
    const googleMapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
    
    const messageTitle = recipientType === 'muthawif' 
      ? '🆘 *DARURAT - SAYA TERSESAT*' 
      : '📍 *Bantuan Lokasi Dibutuhkan*';
    
    const message = `${messageTitle}

Saya membutuhkan bantuan! Berikut lokasi GPS saya:

📍 *Koordinat:*
Lat: ${latitude.toFixed(6)}
Long: ${longitude.toFixed(6)}

🗺️ *Lihat di Google Maps:*
${googleMapsUrl}

⏰ Waktu: ${new Date().toLocaleString('id-ID', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    })}

_Dikirim dari Arah Umroh App_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp dibuka",
      description: "Pilih kontak untuk mengirim lokasi Anda",
    });
  };

  const openNearestHospital = () => {
    if (location) {
      const { latitude, longitude } = location;
      const url = `https://www.google.com/maps/search/hospital/@${latitude},${longitude},15z`;
      window.open(url, '_blank');
    } else {
      // Default to Masjidil Haram area
      const url = `https://www.google.com/maps/search/hospital/@21.4225,39.8262,15z`;
      window.open(url, '_blank');
    }
  };

  const callEmergency = () => {
    // Saudi Arabia emergency numbers
    window.location.href = 'tel:911';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-destructive/90 backdrop-blur-sm"
          />
          
          {/* Modal Content - Centered */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card w-full max-w-sm rounded-3xl p-6 text-center shadow-float max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-destructive/20"
            >
              <AlertTriangle className="w-8 h-8" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-foreground mb-2">Bantuan Darurat</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Jangan panik. Pilih bantuan yang Anda butuhkan.
            </p>

            {/* Location Status */}
            <div className="bg-muted/50 rounded-xl p-3 mb-4">
              {isLoadingLocation ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Mendapatkan lokasi GPS...</span>
                </div>
              ) : locationError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{locationError}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={getCurrentLocation}
                    className="gap-1"
                  >
                    <Navigation className="w-3 h-3" /> Coba Lagi
                  </Button>
                </div>
              ) : location ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Lokasi GPS aktif (±{Math.round(location.accuracy)}m)
                  </span>
                </div>
              ) : null}
            </div>
            
            <div className="space-y-3">
              {/* Share Location - Primary Action */}
              <Button 
                size="lg"
                onClick={() => shareLocationToWhatsApp('muthawif')}
                disabled={isLoadingLocation || !location}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg gap-2 text-base py-6"
              >
                {isLoadingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                SAYA TERSESAT - SHARE LOKASI
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={callEmergency}
                className="w-full border-2 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
              >
                <Phone className="w-4 h-4" /> Telepon Darurat (911)
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={openNearestHospital}
                className="w-full gap-2"
              >
                <Hospital className="w-4 h-4" /> Rumah Sakit Terdekat
              </Button>
            </div>

            {/* Info text */}
            <p className="mt-4 text-xs text-muted-foreground">
              Lokasi Anda akan dikirim melalui WhatsApp ke kontak yang Anda pilih
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SOSModal;
