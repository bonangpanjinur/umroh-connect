import { Play, Pause, Download, Bookmark, ThumbsUp, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { mockManasikSteps } from '@/data/mockData';
import { ManasikStep } from '@/types';
import { Button } from '@/components/ui/button';

const StepCard = ({ step }: { step: ManasikStep }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const typeColors = {
    rukun: 'bg-primary/10 text-primary border-primary/20',
    wajib: 'bg-accent/10 text-accent border-accent/20',
    sunnah: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card p-4 rounded-2xl border shadow-card ${
        step.completed ? 'border-primary/30 bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase ${typeColors[step.type]}`}>
          {step.type} {step.order}
        </span>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
      
      <h3 className="font-bold text-lg text-foreground mb-0.5 flex items-center gap-2">
        {step.title}
        {step.completed && (
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="w-3 h-3" />
          </span>
        )}
      </h3>
      {step.titleArabic && (
        <p className="text-sm text-muted-foreground mb-2 font-arabic">{step.titleArabic}</p>
      )}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.description}</p>
      
      {/* Audio Player */}
      {step.doaArabic && (
        <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3 border border-border">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-primary hover:brightness-110 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </motion.button>
          <div className="flex-1">
            <div className="h-1.5 bg-border rounded-full w-full mb-1.5 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: isPlaying ? '100%' : '33%' }}
                transition={{ duration: isPlaying ? 10 : 0 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>01:20</span>
              <span>04:15</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 flex justify-end">
        <button className="text-[10px] text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors">
          <ThumbsUp className="w-3 h-3" /> Bermanfaat
        </button>
      </div>
    </motion.div>
  );
};

const PanduanView = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-4 bg-card border-b border-border sticky top-14 z-30 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Manasik Umroh</h2>
          <p className="text-xs text-muted-foreground">Panduan audio & visual</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
          <Download className="w-3 h-3" /> Unduh Semua
        </Button>
      </div>
      
      {/* Steps List */}
      <div className="p-4 space-y-4 pb-24">
        {mockManasikSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StepCard step={step} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PanduanView;
