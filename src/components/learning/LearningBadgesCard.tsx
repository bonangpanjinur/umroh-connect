import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { useLearningBadges } from '@/hooks/useLearningBadges';

const LearningBadgesCard = () => {
  const { badges, unlockedCount, totalCount, level } = useLearningBadges();

  return (
    <Card className="border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Pencapaian Belajar</p>
              <p className="text-[10px] text-muted-foreground">
                {unlockedCount}/{totalCount} terbuka · Level: <span className="font-semibold text-primary">{level}</span>
              </p>
            </div>
          </div>
          <Badge variant={level === 'Mahir' ? 'default' : 'secondary'} className="text-[10px]">
            {level}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.key}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-md'
                  : 'bg-muted'
              }`}>
                <span className={`text-xl ${badge.unlocked ? '' : 'grayscale opacity-40'}`}>
                  {badge.icon}
                </span>
                {!badge.unlocked && badge.progress > 0 && (
                  <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray={`${badge.progress * 1.38} 138`} opacity="0.4" />
                  </svg>
                )}
              </div>
              <span className={`text-[9px] text-center font-medium leading-tight ${
                badge.unlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {badge.title}
              </span>
              {!badge.unlocked && (
                <Progress value={badge.progress} className="h-1 w-10" />
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningBadgesCard;
