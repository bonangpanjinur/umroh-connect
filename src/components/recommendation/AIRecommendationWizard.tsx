import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Wallet, Calendar, Hotel, Plane, 
  ChevronRight, ChevronLeft, Loader2, Star, X,
  Check, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PackageWithDetails } from '@/types/database';

interface AIRecommendationWizardProps {
  onClose: () => void;
  onSelectPackage: (pkg: PackageWithDetails) => void;
}

interface Preferences {
  budget: { min: number; max: number };
  duration: { min: number; max: number };
  hotelStar: number;
  flightType: 'direct' | 'transit' | 'any';
}

interface Recommendation {
  package: PackageWithDetails;
  matchScore: number;
  reasoning: string;
  lowestPrice: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const BUDGET_RANGES = [
  { label: 'Ekonomis', min: 20000000, max: 35000000 },
  { label: 'Menengah', min: 35000000, max: 50000000 },
  { label: 'Premium', min: 50000000, max: 80000000 },
  { label: 'VIP', min: 80000000, max: 150000000 },
];

const AIRecommendationWizard = ({ onClose, onSelectPackage }: AIRecommendationWizardProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState('');
  const [preferences, setPreferences] = useState<Preferences>({
    budget: { min: 35000000, max: 50000000 },
    duration: { min: 9, max: 14 },
    hotelStar: 4,
    flightType: 'any',
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      fetchRecommendations();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-packages', {
        body: { preferences }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setRecommendations(data.recommendations || []);
      setSummary(data.summary || '');
      setStep(5); // Results step
    } catch (error) {
      console.error('Recommendation error:', error);
      toast.error('Gagal mendapatkan rekomendasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Wallet className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Budget Anda</h3>
              <p className="text-sm text-muted-foreground">Pilih range budget yang sesuai</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BUDGET_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setPreferences({ ...preferences, budget: { min: range.min, max: range.max } })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    preferences.budget.min === range.min && preferences.budget.max === range.max
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold text-foreground">{range.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(range.min)} - {formatPrice(range.max)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Durasi Perjalanan</h3>
              <p className="text-sm text-muted-foreground">Berapa lama Anda ingin beribadah?</p>
            </div>
            <div className="px-4 space-y-6">
              <div className="text-center py-4 bg-primary/5 rounded-xl">
                <span className="text-3xl font-bold text-primary">
                  {preferences.duration.min} - {preferences.duration.max}
                </span>
                <span className="text-muted-foreground ml-2">hari</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Minimal</label>
                <Slider
                  value={[preferences.duration.min]}
                  min={7}
                  max={preferences.duration.max - 1}
                  step={1}
                  onValueChange={([val]) => setPreferences({ 
                    ...preferences, 
                    duration: { ...preferences.duration, min: val } 
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Maksimal</label>
                <Slider
                  value={[preferences.duration.max]}
                  min={preferences.duration.min + 1}
                  max={21}
                  step={1}
                  onValueChange={([val]) => setPreferences({ 
                    ...preferences, 
                    duration: { ...preferences.duration, max: val } 
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Hotel className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Kualitas Hotel</h3>
              <p className="text-sm text-muted-foreground">Minimal bintang hotel yang diinginkan</p>
            </div>
            <div className="flex justify-center gap-3">
              {[3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setPreferences({ ...preferences, hotelStar: star })}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[80px] ${
                    preferences.hotelStar === star
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex mb-1">
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">{star} Bintang</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Plane className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Tipe Penerbangan</h3>
              <p className="text-sm text-muted-foreground">Preferensi penerbangan Anda</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'any', label: 'Tidak ada preferensi', desc: 'Semua tipe penerbangan' },
                { id: 'direct', label: 'Direct Flight', desc: 'Penerbangan langsung tanpa transit' },
                { id: 'transit', label: 'Transit', desc: 'Penerbangan dengan transit (lebih hemat)' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferences({ ...preferences, flightType: option.id as any })}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                    preferences.flightType === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                  {preferences.flightType === option.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-bold text-foreground">Rekomendasi AI</h3>
              {summary && (
                <p className="text-sm text-muted-foreground mt-1">{summary}</p>
              )}
            </div>
            
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada paket yang sesuai dengan preferensi Anda.</p>
                <Button variant="outline" onClick={() => setStep(1)} className="mt-4">
                  Ubah Preferensi
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.package.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/50"
                      onClick={() => onSelectPackage(rec.package)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {rec.matchScore}% Match
                              </Badge>
                              {index === 0 && (
                                <Badge className="text-xs bg-amber-100 text-amber-800">
                                  Top Pick
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-foreground line-clamp-1">
                              {rec.package.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {rec.package.travel?.name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                            {rec.package.duration_days} hari
                          </span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                            ★{rec.package.hotel_star}
                          </span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                            {rec.package.airline || 'N/A'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {rec.reasoning}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(rec.lowestPrice)}
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-card rounded-3xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg text-foreground">AI Recommendation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        {step <= totalSteps && (
          <div className="px-4 pt-4">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < step ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Langkah {step} dari {totalSteps}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-foreground font-medium">Menganalisis preferensi...</p>
                  <p className="text-sm text-muted-foreground">AI sedang mencari paket terbaik untuk Anda</p>
                </div>
              ) : (
                renderStepContent()
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isLoading && step <= totalSteps && (
          <div className="p-4 border-t border-border flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Kembali
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {step === totalSteps ? (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Cari Rekomendasi
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 5 && recommendations.length > 0 && (
          <div className="p-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(1)} className="w-full">
              Ubah Preferensi
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIRecommendationWizard;
