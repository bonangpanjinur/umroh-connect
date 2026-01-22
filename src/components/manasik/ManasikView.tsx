import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft,
  BookOpen, Check, Star, Lightbulb, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { manasikSteps, ManasikStep } from '@/data/manasikData';
import { cn } from '@/lib/utils';

interface ManasikViewProps {
  onBack?: () => void;
}

const typeStyles = {
  rukun: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    label: 'Rukun'
  },
  wajib: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/20',
    label: 'Wajib'
  },
  sunnah: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    label: 'Sunnah'
  }
};

const AudioPlayer = ({ step }: { step: ManasikStep }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-3 mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </motion.button>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground">Audio Doa</span>
            <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              {Math.floor(progress * 0.03)}:{String(Math.floor((progress * 1.8) % 60)).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">{step.audioDuration}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepCard = ({ 
  step, 
  isActive, 
  onClick 
}: { 
  step: ManasikStep; 
  isActive: boolean;
  onClick: () => void;
}) => {
  const style = typeStyles[step.type];
  
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all w-full text-left",
        isActive 
          ? "bg-primary/10 border-primary shadow-md" 
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
        isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
      )}>
        {step.order}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
            style.bg, style.text
          )}>
            {style.label}
          </span>
        </div>
        <p className="font-semibold text-sm text-foreground truncate">{step.title}</p>
        <p className="text-xs text-muted-foreground font-arabic">{step.titleArabic}</p>
      </div>
      <ChevronRight className={cn(
        "w-5 h-5 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
    </motion.button>
  );
};

const StepDetail = ({ step }: { step: ManasikStep }) => {
  const style = typeStyles[step.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Header Image */}
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src={step.imageUrl} 
          alt={step.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-lg uppercase inline-block mb-1",
            style.bg, style.text
          )}>
            {style.label} {step.order}
          </span>
          <h2 className="text-xl font-bold text-white">{step.title}</h2>
          <p className="text-white/80 font-arabic text-sm">{step.titleArabic}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
      </div>

      {/* Doa Section */}
      {step.doaArabic && (
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Bacaan Doa</span>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-2xl font-arabic text-foreground leading-loose mb-2 dir-rtl">
              {step.doaArabic}
            </p>
            {step.doaLatin && (
              <p className="text-sm italic text-muted-foreground mb-2">{step.doaLatin}</p>
            )}
            {step.doaMeaning && (
              <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                <span className="font-medium">Artinya:</span> {step.doaMeaning}
              </p>
            )}
          </div>

          {step.audioDuration && <AudioPlayer step={step} />}
        </div>
      )}

      {/* Detailed Steps */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Langkah-langkah</span>
        </div>
        <div className="space-y-2">
          {step.detailedSteps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {step.tips && step.tips.length > 0 && (
        <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">Tips Penting</span>
          </div>
          <ul className="space-y-2">
            {step.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

const ManasikView = ({ onBack }: ManasikViewProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showList, setShowList] = useState(true);

  const currentStep = manasikSteps[activeStep];
  const progress = ((activeStep + 1) / manasikSteps.length) * 100;

  const handleNext = () => {
    if (activeStep < manasikSteps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Header */}
      <div className="sticky top-14 z-30 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">Panduan Manasik</h2>
              <p className="text-xs text-muted-foreground">
                Langkah {activeStep + 1} dari {manasikSteps.length}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setShowList(!showList)}
          >
            {showList ? 'Lihat Detail' : 'Lihat Daftar'}
          </Button>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {showList ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {manasikSteps.map((step, idx) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isActive={idx === activeStep}
                  onClick={() => {
                    setActiveStep(idx);
                    setShowList(false);
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StepDetail step={currentStep} />
              
              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={activeStep === 0}
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  className="flex-1"
                  disabled={activeStep === manasikSteps.length - 1}
                  onClick={handleNext}
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ManasikView;
