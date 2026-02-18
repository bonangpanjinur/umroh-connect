import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFINITIONS: Record<string, { title: string; description: string; icon: string }> = {
  first_read: { title: 'Langkah Pertama', description: 'Pertama kali mencatat tadarus', icon: '📖' },
  streak_7: { title: '7 Hari Berturut', description: 'Tadarus 7 hari beruntun', icon: '🔥' },
  streak_30: { title: '30 Hari Istiqomah', description: 'Tadarus 30 hari beruntun', icon: '⭐' },
  streak_100: { title: '100 Hari Istiqomah', description: 'Tadarus 100 hari beruntun', icon: '🏆' },
  juz_1: { title: '1 Juz Tercapai', description: 'Membaca 1 juz penuh', icon: '📗' },
  juz_5: { title: '5 Juz Tercapai', description: 'Membaca 5 juz penuh', icon: '📚' },
  juz_10: { title: '10 Juz Tercapai', description: 'Membaca 10 juz penuh', icon: '🌟' },
  khatam: { title: 'Khatam!', description: 'Khatam 30 Juz Al-Quran', icon: '🕌' },
  ayat_1000: { title: '1000 Ayat', description: 'Membaca 1000 ayat', icon: '✨' },
  ayat_5000: { title: '5000 Ayat', description: 'Membaca 5000 ayat', icon: '💎' },
};

export const useAchievements = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: userAchievements, isLoading } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_achievements' as any)
        .select('*')
        .eq('user_id', user.id);

      if (error) return [];
      return data as unknown as { achievement_key: string; unlocked_at: string }[];
    },
    enabled: !!user?.id,
  });

  const unlockAchievement = useMutation({
    mutationFn: async (achievementKey: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_achievements' as any)
        .insert({ user_id: user.id, achievement_key: achievementKey } as any);

      // Ignore unique violation (already unlocked)
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', user?.id] });
    },
  });

  const achievements: Achievement[] = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => {
    const unlocked = userAchievements?.find(a => a.achievement_key === key);
    return {
      key,
      ...def,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlocked_at,
    };
  });

  const checkAndUnlock = async (stats: { totalVerses: number; estimatedJuz: number; daysRead: number; currentStreak?: number }) => {
    if (!user?.id) return;

    const toUnlock: string[] = [];
    
    if (stats.totalVerses > 0) toUnlock.push('first_read');
    if (stats.totalVerses >= 1000) toUnlock.push('ayat_1000');
    if (stats.totalVerses >= 5000) toUnlock.push('ayat_5000');
    if (stats.estimatedJuz >= 1) toUnlock.push('juz_1');
    if (stats.estimatedJuz >= 5) toUnlock.push('juz_5');
    if (stats.estimatedJuz >= 10) toUnlock.push('juz_10');
    if (stats.estimatedJuz >= 30) toUnlock.push('khatam');
    if ((stats.currentStreak || 0) >= 7) toUnlock.push('streak_7');
    if ((stats.currentStreak || 0) >= 30) toUnlock.push('streak_30');
    if ((stats.currentStreak || 0) >= 100) toUnlock.push('streak_100');

    const alreadyUnlocked = new Set(userAchievements?.map(a => a.achievement_key) || []);
    const newAchievements = toUnlock.filter(key => !alreadyUnlocked.has(key));

    for (const key of newAchievements) {
      await unlockAchievement.mutateAsync(key);
    }

    return newAchievements;
  };

  return {
    achievements,
    isLoading,
    unlockAchievement,
    checkAndUnlock,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievements.length,
  };
};
