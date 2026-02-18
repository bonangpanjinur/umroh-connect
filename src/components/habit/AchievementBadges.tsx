import { Card, CardContent } from '@/components/ui/card';
import { useAchievements } from '@/hooks/useAchievements';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementBadges = () => {
  const { achievements, unlockedCount, totalCount, isLoading } = useAchievements();

  if (isLoading) return null;

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Achievement</p>
              <p className="text-[10px] text-muted-foreground">{unlockedCount}/{totalCount} terbuka</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {unlocked.map((a, i) => (
            <motion.div
              key={a.key}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <span className="text-base">{a.icon}</span>
              </div>
              <span className="text-[8px] text-center font-medium text-foreground leading-tight">{a.title}</span>
            </motion.div>
          ))}
          {locked.slice(0, Math.max(0, 5 - unlocked.length)).map((a) => (
            <div key={a.key} className="flex flex-col items-center gap-1 opacity-30">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-base grayscale">{a.icon}</span>
              </div>
              <span className="text-[8px] text-center text-muted-foreground leading-tight">???</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;
