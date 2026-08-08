import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Check, ChevronRight, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DzikirSessionType,
  dzikirSessionLabel,
  getDzikirSession,
} from '@/data/dzikirData';

const storageKey = (type: DzikirSessionType) =>
  `dzikir_session_${type}_${format(new Date(), 'yyyy-MM-dd')}`;

export const isDzikirSessionDone = (type: DzikirSessionType) => {
  try {
    return localStorage.getItem(storageKey(type)) === 'done';
  } catch {
    return false;
  }
};

interface DzikirSessionModalProps {
  isOpen: boolean;
  type: DzikirSessionType;
  onClose: () => void;
  onCompleted?: () => void;
}

const DzikirSessionModal = ({ isOpen, type, onClose, onCompleted }: DzikirSessionModalProps) => {
  const items = useMemo(() => getDzikirSession(type), [type]);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
      setCount(0);
      setFinished(false);
    }
  }, [isOpen, type]);

  const current = items[index];
  const overall = Math.round(((index + (current ? count / current.count : 0)) / items.length) * 100);

  const handleTap = () => {
    if (!current) return;
    const next = count + 1;
    if (navigator.vibrate) navigator.vibrate(15);

    if (next >= current.count) {
      if (index + 1 >= items.length) {
        try {
          localStorage.setItem(storageKey(type), 'done');
        } catch {
          /* ignore */
        }
        setFinished(true);
        setCount(current.count);
        onCompleted?.();
      } else {
        setIndex(index + 1);
        setCount(0);
      }
    } else {
      setCount(next);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>{dzikirSessionLabel(type)}</span>
            <Badge variant="secondary" className="text-[10px]">
              {Math.min(index + 1, items.length)}/{items.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Progress value={finished ? 100 : overall} className="h-1.5" />

        {finished ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold">{dzikirSessionLabel(type)} selesai</p>
            <p className="text-xs text-muted-foreground">
              Semoga Allah menerima dzikir dan doamu hari ini.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIndex(0);
                  setCount(0);
                  setFinished(false);
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Ulangi
              </Button>
              <Button size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          current && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-xs font-semibold text-primary">{current.title}</p>
                <p className="text-2xl leading-relaxed font-arabic" dir="rtl">
                  {current.arabic}
                </p>
                <p className="text-xs italic text-muted-foreground">{current.latin}</p>
                <p className="text-xs text-foreground/80">{current.translation}</p>
                {current.source && (
                  <p className="text-[10px] text-muted-foreground">{current.source}</p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleTap}
                aria-label="Hitung dzikir"
                className="w-full rounded-2xl bg-primary text-primary-foreground py-6 flex flex-col items-center gap-1"
              >
                <span className="text-3xl font-bold font-mono">
                  {count}/{current.count}
                </span>
                <span className="text-[11px] opacity-80">Ketuk untuk menghitung</span>
              </motion.button>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  disabled={index === 0}
                  onClick={() => {
                    setIndex(Math.max(0, index - 1));
                    setCount(0);
                  }}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (index + 1 >= items.length) {
                      try {
                        localStorage.setItem(storageKey(type), 'done');
                      } catch {
                        /* ignore */
                      }
                      setFinished(true);
                      onCompleted?.();
                    } else {
                      setIndex(index + 1);
                      setCount(0);
                    }
                  }}
                >
                  Lewati
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DzikirSessionModal;
