import { X, RotateCcw, Check, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDzikirTypes, useLogDzikir } from '@/hooks/useDzikirTracking';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DzikirType {
  id: string;
  name: string;
  name_arabic: string | null;
  description: string | null;
  default_target: number;
  category: string;
  icon: string | null;
}

const TasbihModal = ({ isOpen, onClose }: TasbihModalProps) => {
  const { user } = useAuthContext();
  const { data: dzikirTypes = [] } = useDzikirTypes();
  const logDzikir = useLogDzikir();
  
  const [selectedDzikir, setSelectedDzikir] = useState<DzikirType | null>(null);
  const [count, setCount] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDzikir(null);
      setCount(0);
    }
  }, [isOpen]);

  const handleTap = () => {
    if (!selectedDzikir) return;
    
    setCount(prev => prev + 1);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleSave = async () => {
    if (!user || !selectedDzikir || count === 0) return;
    
    try {
      await logDzikir.mutateAsync({
        userId: user.id,
        dzikirTypeId: selectedDzikir.id,
        count,
        targetCount: selectedDzikir.default_target,
        sessionId,
      });
      toast.success(`${selectedDzikir.name} tersimpan: ${count}x 🤲`);
      setCount(0);
      setSelectedDzikir(null);
    } catch (error) {
      toast.error('Gagal menyimpan dzikir');
    }
  };

  const handleBack = () => {
    if (count > 0 && user) {
      // Auto-save before going back
      handleSave();
    }
    setSelectedDzikir(null);
    setCount(0);
  };

  const handleClose = () => {
    if (count > 0 && user && selectedDzikir) {
      handleSave();
    }
    onClose();
  };

  const progress = selectedDzikir 
    ? Math.min((count / selectedDzikir.default_target) * 100, 100) 
    : 0;
  const isCompleted = selectedDzikir && count >= selectedDzikir.default_target;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b">
            {selectedDzikir ? (
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9" />
            )}
            <h3 className="text-lg font-bold text-foreground">
              {selectedDzikir ? selectedDzikir.name : 'Tasbih Digital'}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedDzikir ? (
              // Dzikir Selection Screen
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Pilih dzikir yang akan dihitung
                </p>
                
                {dzikirTypes.map((dzikir, index) => (
                  <motion.div
                    key={dzikir.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                      onClick={() => setSelectedDzikir(dzikir)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{dzikir.name}</h4>
                            {dzikir.name_arabic && (
                              <p className="text-lg font-arabic text-primary mt-1">
                                {dzikir.name_arabic}
                              </p>
                            )}
                            {dzikir.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {dzikir.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {dzikir.default_target}x
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {dzikirTypes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Belum ada dzikir tersedia</p>
                    <p className="text-xs mt-1">Admin dapat menambahkan dari dashboard</p>
                  </div>
                )}
              </div>
            ) : (
              // Counter Screen
              <div className="text-center">
                {selectedDzikir.name_arabic && (
                  <p className="text-2xl font-arabic text-primary mb-2">
                    {selectedDzikir.name_arabic}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-6">
                  Target: {selectedDzikir.default_target}x
                </p>
                
                {/* Progress Ring */}
                <div className="relative w-52 h-52 mx-auto mb-4">
                  {/* Background ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="104"
                      cy="104"
                      r="96"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <circle
                      cx="104"
                      cy="104"
                      r="96"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${progress * 6.03} 603`}
                      strokeLinecap="round"
                      className={`transition-all duration-300 ${
                        isCompleted ? 'text-emerald-500' : 'text-primary'
                      }`}
                    />
                  </svg>
                  
                  {/* Counter Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTap}
                    className={`absolute inset-4 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-secondary/80 hover:bg-secondary'
                    }`}
                  >
                    <div className="text-center">
                      <motion.span
                        key={count}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-5xl font-bold font-mono block ${
                          isCompleted ? 'text-white' : 'text-primary'
                        }`}
                      >
                        {count}
                      </motion.span>
                      {isCompleted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-1 mt-1"
                        >
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Selesai!</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                </div>
                
                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="text-sm text-muted-foreground flex items-center gap-1.5 mx-auto hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t space-y-2">
            {selectedDzikir && count > 0 && user && (
              <Button 
                onClick={handleSave}
                className="w-full bg-primary"
                disabled={logDzikir.isPending}
              >
                {logDzikir.isPending ? 'Menyimpan...' : `Simpan (${count}x)`}
              </Button>
            )}
            <Button
              onClick={handleClose}
              variant="secondary"
              className="w-full"
            >
              {selectedDzikir ? 'Selesai' : 'Tutup'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TasbihModal;
