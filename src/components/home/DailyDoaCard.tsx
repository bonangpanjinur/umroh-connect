import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePrayers } from '@/hooks/usePrayers';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DailyDoaCard = () => {
  const { data: prayers = [], isLoading } = usePrayers();
  
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  
  const [offset, setOffset] = useState(0);

  if (isLoading || prayers.length === 0) return null;

  const index = (dayOfYear + offset + prayers.length * 1000) % prayers.length;
  const prayer = prayers[index];

  return (
    <div className="px-4">
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 overflow-hidden">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">Doa Hari Ini</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOffset(o => o - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOffset(o => o + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
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
              <h4 className="text-sm font-medium text-foreground mb-1">{prayer.title}</h4>
              {prayer.arabic_text && (
                <p className="text-right text-base font-arabic text-foreground leading-loose mb-1.5">
                  {prayer.arabic_text}
                </p>
              )}
              {prayer.transliteration && (
                <p className="text-[11px] text-muted-foreground italic">{prayer.transliteration}</p>
              )}
              {prayer.translation && (
                <p className="text-[11px] text-muted-foreground mt-1">{prayer.translation}</p>
              )}
              {prayer.category?.name && (
                <p className="text-[10px] text-primary/70 mt-1.5">📖 {prayer.category.name}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyDoaCard;
