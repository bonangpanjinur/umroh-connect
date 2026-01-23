import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft,
  BookOpen, Star, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAllManasikGuides, ManasikGuide } from '@/hooks/useManasikGuides';
import { cn } from '@/lib/utils';

interface ManasikViewProps {
  onBack?: () => void;
}

const typeStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
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
  },
  umroh: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    label: 'Umroh'
  },
  haji: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/20',
    label: 'Haji'
  }
};

const AudioPlayer = ({ }: { guide: ManasikGuide }) => {
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
            <span className="text-[10px] text-muted-foreground">3:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepCard = ({ 
  guide, 
  index,
  isActive, 
  onClick 
}: { 
  guide: ManasikGuide; 
  index: number;
  isActive: boolean;
  onClick: () => void;
}) => {
  const style = typeStyles[guide.category] || typeStyles.umroh;
  
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
        {index + 1}
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
        <p className="font-semibold text-sm text-foreground truncate">{guide.title}</p>
        {guide.title_arabic && (
          <p className="text-xs text-muted-foreground font-arabic">{guide.title_arabic}</p>
        )}
      </div>
      <ChevronRight className={cn(
        "w-5 h-5 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
    </motion.button>
  );
};

const StepDetail = ({ guide, index }: { guide: ManasikGuide; index: number }) => {
  const style = typeStyles[guide.category] || typeStyles.umroh;
  
  // Parse content for detailed steps (content can be markdown or plain text)
  const contentLines = guide.content.split('\n').filter(line => line.trim());
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Header Image */}
      <div className="relative rounded-2xl overflow-hidden">
        {guide.image_url ? (
          <img 
            src={guide.image_url} 
            alt={guide.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-lg uppercase inline-block mb-1",
            style.bg, style.text
          )}>
            {style.label} {index + 1}
          </span>
          <h2 className="text-xl font-bold text-white">{guide.title}</h2>
          {guide.title_arabic && (
            <p className="text-white/80 font-arabic text-sm">{guide.title_arabic}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {guide.description && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
        </div>
      )}

      {/* Video */}
      {guide.video_url && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Video Panduan</span>
          </div>
          <a 
            href={guide.video_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            Tonton Video
          </a>
        </div>
      )}

      {/* Content / Detailed Steps */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Panduan Lengkap</span>
        </div>
        <div className="space-y-2 prose prose-sm max-w-none">
          {contentLines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Player (demo) */}
      <AudioPlayer guide={guide} />
    </motion.div>
  );
};

const ManasikView = ({ onBack }: ManasikViewProps) => {
  const { data: guides = [], isLoading } = useAllManasikGuides();
  const [activeStep, setActiveStep] = useState(0);
  const [showList, setShowList] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h2 className="text-lg font-bold text-foreground">Panduan Manasik</h2>
        </div>
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada panduan manasik tersedia.</p>
          <p className="text-sm text-muted-foreground mt-1">Panduan akan ditambahkan oleh admin.</p>
        </div>
      </motion.div>
    );
  }

  const currentGuide = guides[activeStep];
  const progress = ((activeStep + 1) / guides.length) * 100;

  const handleNext = () => {
    if (activeStep < guides.length - 1) {
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
                Langkah {activeStep + 1} dari {guides.length}
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
              {guides.map((guide, idx) => (
                <StepCard
                  key={guide.id}
                  guide={guide}
                  index={idx}
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
              <StepDetail guide={currentGuide} index={activeStep} />
              
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
                  disabled={activeStep === guides.length - 1}
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
