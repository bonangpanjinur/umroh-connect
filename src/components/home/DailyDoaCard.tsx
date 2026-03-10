import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePrayers } from '@/hooks/usePrayers';
import { ChevronLeft, ChevronRight, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DailyDoaCard = () => {
  const { data: prayers = [], isLoading } = usePrayers();
  
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  
  const [offset, setOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading || prayers.length === 0) return null;

  const index = (dayOfYear + offset + prayers.length * 1000) % prayers.length;
  const prayer = prayers[index];

  return (
    <div className="px-4">
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 overflow-hidden">
        <CardContent className="py-2.5 px-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Doa Hari Ini</span>
            </div>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setOffset(o => o - 1); setIsExpanded(false); }}>
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setOffset(o => o + 1); setIsExpanded(false); }}>
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h4 className="text-xs font-medium text-foreground mb-1">{prayer.title}</h4>
              
              <div className={`relative ${!isExpanded ? 'max-h-[100px] overflow-hidden' : ''}`}>
                {prayer.arabic_text && (
                  <p className={`text-right text-sm font-arabic text-foreground leading-relaxed mb-1 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {prayer.arabic_text}
                  </p>
                )}
                {prayer.transliteration && (
                  <p className={`text-[10px] text-muted-foreground italic ${!isExpanded ? 'line-clamp-1' : ''}`}>
                    {prayer.transliteration}
                  </p>
                )}
                {prayer.translation && (
                  <p className={`text-[10px] text-muted-foreground mt-0.5 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {prayer.translation}
                  </p>
                )}
                {isExpanded && prayer.category?.name && (
                  <p className="text-[9px] text-primary/70 mt-1">📖 {prayer.category.name}</p>
                )}
                
                {/* Fade overlay when collapsed */}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                )}
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-0.5 text-[10px] text-primary font-medium mt-1 hover:underline"
              >
                {isExpanded ? (
                  <>Tutup <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Selengkapnya <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyDoaCard;
