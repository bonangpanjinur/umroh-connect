import { useEffect, useCallback } from 'react';
import { useManasikProgress } from './useManasikProgress';
import { useManasikGuides } from './useManasikGuides';
import { toast } from '@/hooks/use-toast';

const REMINDER_KEY = 'learning_reminder_last';
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useLearningReminder = () => {
  const { completedSteps } = useManasikProgress();
  const { data: guides = [] } = useManasikGuides('umroh');

  const checkAndRemind = useCallback(() => {
    if (guides.length === 0) return;
    
    const completedCount = completedSteps.filter(id => guides.some(g => g.id === id)).length;
    
    // Don't remind if all done
    if (completedCount >= guides.length) return;

    try {
      const lastReminder = localStorage.getItem(REMINDER_KEY);
      const now = Date.now();
      
      if (lastReminder && now - parseInt(lastReminder) < REMINDER_INTERVAL_MS) return;

      localStorage.setItem(REMINDER_KEY, String(now));

      const remaining = guides.length - completedCount;
      const nextGuide = guides.find(g => !completedSteps.includes(g.id));

      setTimeout(() => {
        toast({
          title: '📖 Lanjutkan Belajar Manasik',
          description: `${remaining} langkah lagi! ${nextGuide ? `Selanjutnya: ${nextGuide.title}` : ''}`,
        });
      }, 3000); // delay 3s after page load
    } catch {}
  }, [completedSteps, guides]);

  useEffect(() => {
    checkAndRemind();
  }, [checkAndRemind]);
};
