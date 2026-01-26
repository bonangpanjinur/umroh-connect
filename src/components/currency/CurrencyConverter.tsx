import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ArrowUpDown, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CurrencyConverterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  source: string;
}

const CurrencyConverter = ({ isOpen, onClose }: CurrencyConverterProps) => {
  const { toast } = useToast();
  const [idrAmount, setIdrAmount] = useState<string>('1000000');
  const [sarAmount, setSarAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<'idr-to-sar' | 'sar-to-idr'>('idr-to-sar');

  // Fallback rate if API fails - typical rate around 4200 IDR per SAR
  const FALLBACK_RATE = 4200;

  const fetchExchangeRate = useCallback(async () => {
    setIsLoading(true);
    try {
      // Using a free exchange rate API
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/SAR'
      );
      
      if (!response.ok) throw new Error('Failed to fetch rate');
      
      const data = await response.json();
      const idrRate = data.rates?.IDR;
      
      if (idrRate) {
        setExchangeRate({
          rate: idrRate,
          lastUpdated: new Date().toLocaleString('id-ID', {
            dateStyle: 'short',
            timeStyle: 'short'
          }),
          source: 'ExchangeRate-API'
        });
      } else {
        throw new Error('Rate not found');
      }
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      // Use fallback rate
      setExchangeRate({
        rate: FALLBACK_RATE,
        lastUpdated: new Date().toLocaleString('id-ID', {
          dateStyle: 'short',
          timeStyle: 'short'
        }),
        source: 'Offline (estimasi)'
      });
      toast({
        title: 'Menggunakan rate offline',
        description: 'Tidak dapat mengambil rate real-time, menggunakan estimasi.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch rate on mount
  useEffect(() => {
    if (isOpen && !exchangeRate) {
      fetchExchangeRate();
    }
  }, [isOpen, fetchExchangeRate, exchangeRate]);

  // Calculate conversion
  useEffect(() => {
    if (!exchangeRate) return;

    if (direction === 'idr-to-sar') {
      const idr = parseFloat(idrAmount.replace(/[^\d]/g, '')) || 0;
      const sar = idr / exchangeRate.rate;
      setSarAmount(sar.toFixed(2));
    } else {
      const sar = parseFloat(sarAmount.replace(/[^\d]/g, '')) || 0;
      const idr = sar * exchangeRate.rate;
      setIdrAmount(Math.round(idr).toString());
    }
  }, [idrAmount, sarAmount, exchangeRate, direction]);

  const formatIDR = (value: string) => {
    const num = parseInt(value.replace(/[^\d]/g, '')) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleIdrChange = (value: string) => {
    if (direction === 'sar-to-idr') setDirection('idr-to-sar');
    setIdrAmount(value.replace(/[^\d]/g, ''));
  };

  const handleSarChange = (value: string) => {
    if (direction === 'idr-to-sar') setDirection('sar-to-idr');
    setSarAmount(value);
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'idr-to-sar' ? 'sar-to-idr' : 'idr-to-sar');
  };

  // Quick amounts in IDR
  const quickAmounts = [500000, 1000000, 5000000, 10000000];

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
        
        {/* Modal Content - Always Centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-lg">Kurs IDR ↔ SAR</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Rate Info */}
            {exchangeRate && (
              <div className="mt-3 flex items-center justify-between text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>1 SAR = Rp {exchangeRate.rate.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{exchangeRate.lastUpdated}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-5 space-y-4">
            {/* IDR Input */}
            <Card className="p-4 border-2 border-transparent focus-within:border-primary transition-colors">
              <label className="text-xs text-muted-foreground font-medium mb-2 block">
                🇮🇩 Rupiah Indonesia (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  Rp
                </span>
                <Input
                  type="text"
                  value={formatIDR(idrAmount)}
                  onChange={(e) => handleIdrChange(e.target.value)}
                  className="pl-10 text-xl font-bold border-0 bg-transparent h-12 focus-visible:ring-0"
                  placeholder="0"
                />
              </div>
            </Card>

            {/* Toggle Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDirection}
                className="rounded-full w-10 h-10 bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            {/* SAR Input */}
            <Card className="p-4 border-2 border-transparent focus-within:border-primary transition-colors bg-emerald-50 dark:bg-emerald-950/20">
              <label className="text-xs text-muted-foreground font-medium mb-2 block">
                🇸🇦 Riyal Saudi (SAR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  ﷼
                </span>
                <Input
                  type="text"
                  value={sarAmount}
                  onChange={(e) => handleSarChange(e.target.value)}
                  className="pl-10 text-xl font-bold border-0 bg-transparent h-12 focus-visible:ring-0"
                  placeholder="0.00"
                />
              </div>
            </Card>

            {/* Quick Amounts */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Jumlah Cepat:</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDirection('idr-to-sar');
                      setIdrAmount(amount.toString());
                    }}
                    className="text-xs"
                  >
                    {amount >= 1000000 ? `${amount / 1000000}jt` : `${amount / 1000}rb`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={fetchExchangeRate}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Memperbarui...' : 'Perbarui Kurs'}
            </Button>

            {/* Source */}
            {exchangeRate && (
              <p className="text-center text-xs text-muted-foreground">
                Sumber: {exchangeRate.source}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CurrencyConverter;
