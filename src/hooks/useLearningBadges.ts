import { useMemo } from 'react';
import { useManasikProgress } from './useManasikProgress';
import { useManasikGuides } from './useManasikGuides';

export interface LearningBadge {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0-100
}

export const useLearningBadges = () => {
  const { completedSteps } = useManasikProgress();
  const { data: manasikGuides = [] } = useManasikGuides('umroh');

  // Checklist from localStorage
  const checkedItems = useMemo(() => {
    try {
      const saved = localStorage.getItem('umroh_checklist');
      return saved ? JSON.parse(saved) as string[] : [];
    } catch { return []; }
  }, [completedSteps]); // re-evaluate when manasik changes

  const totalManasik = manasikGuides.length;
  const completedManasik = completedSteps.filter(id => manasikGuides.some(g => g.id === id)).length;
  const totalChecklist = 31; // fixed count from checklistCategories

  const badges: LearningBadge[] = useMemo(() => [
    {
      key: 'first_step',
      title: 'Langkah Pertama',
      description: 'Pelajari 1 langkah manasik',
      icon: '👣',
      unlocked: completedManasik >= 1,
      progress: Math.min(completedManasik >= 1 ? 100 : 0, 100),
    },
    {
      key: 'halfway',
      title: 'Setengah Jalan',
      description: 'Selesaikan 50% manasik',
      icon: '⭐',
      unlocked: totalManasik > 0 && completedManasik >= Math.ceil(totalManasik / 2),
      progress: totalManasik > 0 ? Math.min((completedManasik / Math.ceil(totalManasik / 2)) * 100, 100) : 0,
    },
    {
      key: 'manasik_master',
      title: 'Paham Manasik',
      description: 'Selesaikan semua langkah manasik',
      icon: '🕋',
      unlocked: totalManasik > 0 && completedManasik >= totalManasik,
      progress: totalManasik > 0 ? (completedManasik / totalManasik) * 100 : 0,
    },
    {
      key: 'packer',
      title: 'Siap Berkemas',
      description: 'Centang 10 item checklist',
      icon: '🧳',
      unlocked: checkedItems.length >= 10,
      progress: Math.min((checkedItems.length / 10) * 100, 100),
    },
    {
      key: 'full_checklist',
      title: 'Persiapan Sempurna',
      description: 'Selesaikan semua checklist',
      icon: '✅',
      unlocked: checkedItems.length >= totalChecklist,
      progress: (checkedItems.length / totalChecklist) * 100,
    },
    {
      key: 'ready',
      title: 'Siap Umroh!',
      description: 'Selesaikan manasik & checklist',
      icon: '🏆',
      unlocked: totalManasik > 0 && completedManasik >= totalManasik && checkedItems.length >= totalChecklist,
      progress: totalManasik > 0
        ? ((completedManasik / totalManasik) * 50 + (checkedItems.length / totalChecklist) * 50)
        : (checkedItems.length / totalChecklist) * 100,
    },
  ], [completedManasik, totalManasik, checkedItems.length]);

  return {
    badges,
    unlockedCount: badges.filter(b => b.unlocked).length,
    totalCount: badges.length,
    level: completedManasik === 0 ? 'Pemula' : 
           (totalManasik > 0 && completedManasik >= totalManasik) ? 'Mahir' : 'Siap',
  };
};
