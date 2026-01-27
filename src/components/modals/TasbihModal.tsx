import { X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TasbihModal = ({ isOpen, onClose }: TasbihModalProps) => {
  const [count, setCount] = useState(0);

  const handleTap = () => {
    setCount(prev => prev + 1);
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  if (!isOpen) return null;

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
        
        {/* Modal Content - Centered */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Tasbih Digital</h3>
            <p className="text-sm text-muted-foreground mb-6">Ketuk lingkaran untuk menghitung</p>
            
            {/* Counter Circle */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={handleTap}
              className="w-48 h-48 mx-auto rounded-full border-8 border-primary/20 flex items-center justify-center relative shadow-inner bg-secondary/50 cursor-pointer select-none"
            >
              <motion.span
                key={count}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-bold text-primary font-mono"
              >
                {count}
              </motion.span>
              
              {/* Ripple effect */}
              <motion.div
                key={`ripple-${count}`}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 rounded-full bg-primary/20"
              />
            </motion.div>
            
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="mt-4 text-sm text-muted-foreground flex items-center gap-1.5 mx-auto hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
          
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full mt-6"
          >
            Tutup
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TasbihModal;
