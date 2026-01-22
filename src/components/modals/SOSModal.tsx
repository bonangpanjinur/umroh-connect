import { AlertTriangle, MapPin, Phone, Hospital, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOSModal = ({ isOpen, onClose }: SOSModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-destructive/90 backdrop-blur-sm flex items-center justify-center p-6"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card w-[90%] max-w-sm rounded-3xl p-6 text-center shadow-float"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-destructive/20"
          >
            <AlertTriangle className="w-8 h-8" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-foreground mb-2">Bantuan Darurat</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Jangan panik. Pilih bantuan yang Anda butuhkan.
          </p>
          
          <div className="space-y-3">
            <Button 
              size="lg"
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg gap-2 text-base py-6"
            >
              <MapPin className="w-5 h-5" /> SAYA TERSESAT
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full border-2 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
            >
              <Phone className="w-4 h-4" /> Hubungi Muthawif
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
            >
              <Hospital className="w-4 h-4" /> Rumah Sakit Terdekat
            </Button>
          </div>
          
          <button
            onClick={onClose}
            className="mt-6 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            Tutup
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SOSModal;
