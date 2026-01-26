import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QiblaModal = ({ isOpen, onClose }: QiblaModalProps) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Simulate compass direction (in real app, use device orientation API)
      setTimeout(() => setRotation(-65), 300);
    }
  }, [isOpen]);

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
          className="absolute inset-0 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card w-[90%] max-w-sm rounded-3xl p-6 text-center"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">Arah Kiblat</h3>
          
          {/* Compass */}
          <div className="relative w-64 h-64 mx-auto mb-6 rounded-full border-4 border-border bg-secondary/50 flex items-center justify-center shadow-inner">
            {/* Cardinal directions */}
            <div className="absolute top-3 text-xs font-bold text-muted-foreground">U</div>
            <div className="absolute bottom-3 text-xs font-bold text-muted-foreground">S</div>
            <div className="absolute left-3 text-xs font-bold text-muted-foreground">B</div>
            <div className="absolute right-3 text-xs font-bold text-muted-foreground">T</div>
            
            {/* Compass dial */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
              className="w-full h-full flex items-center justify-center relative"
            >
              {/* Kaaba icon */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">
                🕋
              </div>
              
              {/* Needle */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-1 h-24 bg-destructive rounded-full origin-bottom shadow-lg" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-1 h-24 bg-muted-foreground rounded-full origin-top" 
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
              />
              
              {/* Center dot */}
              <div className="w-4 h-4 rounded-full bg-foreground shadow-lg z-10" />
            </motion.div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Arahkan ponsel ke arah yang ditunjukkan
          </p>
          
          <Button onClick={onClose} className="w-full">
            Tutup
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QiblaModal;
