import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallPrompt = () => {
  const { isIOS, promptInstall, dismissPrompt, shouldShowPrompt } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Delay showing prompt by 5 seconds after page load
    const timer = setTimeout(() => {
      if (shouldShowPrompt) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      const success = await promptInstall();
      if (success) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShowPrompt(false);
    setShowIOSGuide(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center sm:items-center p-4"
        onClick={handleDismiss}
      >
        {/* Modal */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header with close button */}
          <div className="relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="bg-gradient-primary pt-8 pb-12 px-6 text-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 rounded-2xl bg-white shadow-lg mx-auto flex items-center justify-center"
              >
                <img 
                  src="/pwa-192x192.png" 
                  alt="Arah Umroh" 
                  className="w-16 h-16 rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 -mt-6 bg-card rounded-t-3xl relative">
            {!showIOSGuide ? (
              <>
                <h3 className="text-xl font-bold text-center mb-2">
                  Pasang Arah Umroh
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Akses cepat ke fitur ibadah & paket umroh langsung dari layar utama HP Anda
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Akses Instan</p>
                      <p className="text-xs text-muted-foreground">Buka langsung dari homescreen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <Download className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bekerja Offline</p>
                      <p className="text-xs text-muted-foreground">Akses doa & panduan tanpa internet</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                    Nanti Saja
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleInstall}>
                    <Download className="w-4 h-4" />
                    Pasang Sekarang
                  </Button>
                </div>
              </>
            ) : (
              /* iOS Installation Guide */
              <>
                <h3 className="text-xl font-bold text-center mb-2">
                  Cara Pasang di iPhone
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Ikuti langkah berikut untuk menambahkan Arah Umroh ke homescreen
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Ketuk tombol Share</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Share className="w-5 h-5" />
                        <span>Ikon kotak dengan panah ke atas di Safari</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Scroll dan pilih "Add to Home Screen"</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PlusSquare className="w-5 h-5" />
                        <span>Tambahkan ke Layar Utama</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Ketuk "Add"</p>
                      <p className="text-sm text-muted-foreground">
                        Arah Umroh akan muncul di homescreen Anda
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleDismiss}>
                  Mengerti
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;