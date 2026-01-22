import { Check, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const JourneyTimeline = () => {
  return (
    <div className="p-4 bg-secondary/50 mt-4 border-t border-border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-foreground">Timeline Ibadah</h3>
        <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium">
          H-7 Manasik
        </span>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card p-4 rounded-2xl border border-border shadow-card relative overflow-hidden"
      >
        {/* Timeline line */}
        <div className="w-0.5 h-full bg-border absolute left-[31px] top-0" />
        
        {/* Completed step */}
        <div className="relative flex items-center gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10 shadow-primary text-sm">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-muted-foreground line-through">
              Cek Paspor & Visa
            </h4>
          </div>
        </div>
        
        {/* Current step */}
        <div className="relative flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-card border-2 border-primary text-primary flex items-center justify-center z-10 shadow-card font-bold text-sm">
            2
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">
              Hafalan Doa Ihram
            </h4>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              Audio tersedia offline 
              <span className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-2 h-2 text-primary" />
              </span>
            </p>
          </div>
          <Button size="sm" className="shadow-primary text-xs gap-1.5">
            <Play className="w-3 h-3" /> Mulai
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default JourneyTimeline;
