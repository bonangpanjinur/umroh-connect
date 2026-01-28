import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('SW Registered:', swUrl);
      // Check for updates every 30 minutes
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
      >
        <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-primary p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold">Pembaruan Tersedia</p>
                <p className="text-sm text-white/80">Versi baru Arah Umroh siap!</p>
              </div>
              <button
                onClick={handleDismiss}
                className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Pembaruan baru tersedia dengan perbaikan bug dan fitur baru. Perbarui sekarang untuk pengalaman terbaik.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                Nanti
              </Button>
              <Button className="flex-1 gap-2" onClick={handleUpdate}>
                <RefreshCw className="w-4 h-4" />
                Perbarui
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdatePrompt;
