import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, Minus, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const TARGET_GLASSES = 8;
const STORAGE_KEY = 'water_intake';

const WaterIntakeTracker = () => {
  const today = format(new Date(), 'yyyy-MM-dd');

  const [glasses, setGlasses] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved[today] || 0;
    } catch { return 0; }
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      saved[today] = glasses;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }, [glasses, today]);

  const addGlass = () => setGlasses((g: number) => Math.min(g + 1, 12));
  const removeGlass = () => setGlasses((g: number) => Math.max(g - 1, 0));
  const progress = Math.round((glasses / TARGET_GLASSES) * 100);
  const completed = glasses >= TARGET_GLASSES;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Minum Air</p>
              <p className="text-[10px] text-muted-foreground">{glasses}/{TARGET_GLASSES} gelas hari ini</p>
            </div>
          </div>
          {completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-amber-500">
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] font-bold">Tercapai!</span>
            </motion.div>
          )}
        </div>

        {/* Glass Grid */}
        <div className="grid grid-cols-8 gap-1.5 mb-3">
          {Array.from({ length: TARGET_GLASSES }).map((_, i) => {
            const isFilled = i < glasses;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{ 
                  scale: isFilled ? [1, 1.15, 1] : 1,
                  opacity: isFilled ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                className={`aspect-square rounded-lg flex items-center justify-center text-lg ${
                  isFilled 
                    ? 'bg-sky-500/20 dark:bg-sky-500/30' 
                    : 'bg-muted/50'
                }`}
              >
                💧
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <motion.div 
            className="h-full bg-sky-500 rounded-full" 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={removeGlass} disabled={glasses === 0}>
            <Minus className="w-4 h-4" />
          </Button>
          <Button size="sm" className="h-9 px-6 rounded-full gap-1.5 bg-sky-500 hover:bg-sky-600 text-white" onClick={addGlass}>
            <Plus className="w-4 h-4" />
            Tambah Gelas
          </Button>
          <div className="text-sm font-bold text-foreground w-8 text-center">{glasses}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterIntakeTracker;
