import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, Target, TrendingUp, Award, Calendar, 
  CheckCircle2, Circle, Clock
} from 'lucide-react';
import { DefaultHabit, categoryInfo } from '@/data/defaultHabits';

interface HabitProgressCardProps {
  habit: DefaultHabit;
  currentCount: number;
  isCompleted: boolean;
  streak?: number;
  onToggle: () => void;
}

export const HabitProgressCard = ({ 
  habit, 
  currentCount, 
  isCompleted,
  streak = 0,
  onToggle 
}: HabitProgressCardProps) => {
  const info = categoryInfo[habit.category];
  const targetCount = habit.target_count || 1;
  const progress = (currentCount / targetCount) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 overflow-hidden ${
          isCompleted 
            ? 'bg-primary/5 border-primary/30' 
            : 'hover:border-primary/20 hover:shadow-md'
        }`}
        onClick={onToggle}
      >
        <CardContent className="p-0">
          <div className="p-3.5">
            <div className="flex items-start gap-3">
              {/* Checkbox / Progress Circle */}
              <div className="relative">
                {targetCount > 1 ? (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.bgColor} relative`}>
                    <svg className="w-12 h-12 absolute top-0 left-0 -rotate-90">
                      <circle
                        className="text-muted/30"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="transparent"
                        r="20"
                        cx="24"
                        cy="24"
                      />
                      <circle
                        className={info.color}
                        strokeWidth="3"
                        strokeDasharray={125}
                        strokeDashoffset={125 - (progress / 100) * 125}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="20"
                        cx="24"
                        cy="24"
                      />
                    </svg>
                    <span className={`text-sm font-bold ${info.color} z-10`}>
                      {currentCount}
                    </span>
                  </div>
                ) : (
                  <motion.div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted ? 'bg-primary' : info.bgColor
                    }`}
                    animate={isCompleted ? { scale: [1, 1.1, 1] } : {}}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                    ) : (
                      <Circle className={`w-6 h-6 ${info.color}`} />
                    )}
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through opacity-60' : ''}`}>
                    {habit.name}
                  </h4>
                  {habit.is_ramadan_specific && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                      🌙
                    </Badge>
                  )}
                </div>

                {habit.name_arabic && (
                  <p className="text-xs text-muted-foreground/70 font-arabic mb-1" dir="rtl">
                    {habit.name_arabic}
                  </p>
                )}

                {/* Progress bar for multi-count */}
                {targetCount > 1 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className={`font-semibold ${isCompleted ? 'text-primary' : ''}`}>
                        {currentCount}/{targetCount}
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}

                {/* Streak indicator */}
                {streak > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-medium text-orange-500">{streak} hari berturut</span>
                  </div>
                )}
              </div>

              {/* Category Badge */}
              <Badge variant="secondary" className={`text-[10px] px-2 ${info.bgColor} ${info.color} border-0`}>
                {info.label.split(' ')[0]}
              </Badge>
            </div>
          </div>

          {/* Completion Animation Bar */}
          <motion.div 
            className="h-1 bg-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isCompleted ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: 'left' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HabitProgressCard;
