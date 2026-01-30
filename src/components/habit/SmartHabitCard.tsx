import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Circle, Plus, Minus, Flame,
  Clock, Target, Sparkles, ExternalLink
} from 'lucide-react';
import { DefaultHabit, categoryInfo } from '@/data/defaultHabits';

interface SmartHabitCardProps {
  habit: DefaultHabit;
  currentCount: number;
  isCompleted: boolean;
  streak?: number;
  onIncrement: () => void;
  onDecrement?: () => void;
  onOpenTasbih?: () => void;
  variant?: 'default' | 'compact' | 'dzikir';
}

export const SmartHabitCard = ({ 
  habit, 
  currentCount, 
  isCompleted,
  streak = 0,
  onIncrement,
  onDecrement,
  onOpenTasbih,
  variant = 'default'
}: SmartHabitCardProps) => {
  const info = categoryInfo[habit.category];
  const targetCount = habit.target_count || 1;
  const progress = Math.min((currentCount / targetCount) * 100, 100);
  const isMultiTarget = targetCount > 1;
  const isDzikirHabit = habit.id.includes('istighfar') || habit.id.includes('sholawat') || habit.id.includes('tasbih');

  // Render dzikir card with link to tasbih
  if (isDzikirHabit || variant === 'dzikir') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className={`cursor-pointer transition-all border-dashed ${
            isCompleted 
              ? 'bg-primary/5 border-primary/30' 
              : 'bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10'
          }`}
          onClick={onOpenTasbih}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isCompleted ? 'bg-primary' : 'bg-amber-500/20'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through opacity-60' : ''}`}>
                    {habit.name}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Buka Tasbih Digital
                  </p>
                </div>
              </div>
              {isCompleted && (
                <Badge className="bg-primary/10 text-primary border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Selesai
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Multi-target habit with detailed progress
  if (isMultiTarget) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card 
          className={`transition-all duration-300 overflow-hidden ${
            isCompleted 
              ? 'bg-primary/5 border-primary/30' 
              : 'hover:border-primary/20 hover:shadow-md'
          }`}
        >
          <CardContent className="p-0">
            <div className="p-3.5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isCompleted ? 'bg-primary' : info.bgColor
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <Target className={`w-5 h-5 ${info.color}`} />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through opacity-60' : ''}`}>
                      {habit.name}
                    </h4>
                    {habit.name_arabic && (
                      <p className="text-xs text-muted-foreground/70 font-arabic" dir="rtl">
                        {habit.name_arabic}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className={`text-[10px] px-2 ${info.bgColor} ${info.color} border-0`}>
                  {info.label.split(' ')[0]}
                </Badge>
              </div>

              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className={`text-sm font-bold ${isCompleted ? 'text-primary' : info.color}`}>
                    {currentCount} / {targetCount}
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <Progress value={progress} className="h-2" />
                
                {/* Progress Pills for small targets */}
                {targetCount <= 12 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.from({ length: targetCount }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.8 }}
                        animate={{ 
                          scale: idx < currentCount ? 1 : 0.9,
                          opacity: idx < currentCount ? 1 : 0.4
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          idx < currentCount 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {idx + 1}
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {/* +/- Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {onDecrement && currentCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecrement();
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant={isCompleted ? "secondary" : "default"}
                    size="sm"
                    className="h-9 px-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement();
                    }}
                    disabled={isCompleted}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Selesai!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Tambah
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Streak indicator */}
              {streak > 0 && (
                <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-orange-500">{streak} hari berturut</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Single target habit (checkbox style)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          isCompleted 
            ? 'bg-primary/5 border-primary/30' 
            : 'hover:border-primary/20 hover:shadow-md'
        }`}
        onClick={onIncrement}
      >
        <CardContent className="p-3.5">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isCompleted ? 'bg-primary' : info.bgColor
              }`}
              animate={isCompleted ? { scale: [1, 1.1, 1] } : {}}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Circle className={`w-5 h-5 ${info.color}`} />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through opacity-60' : ''}`}>
                {habit.name}
              </h4>
              {habit.name_arabic && (
                <p className="text-xs text-muted-foreground/70 font-arabic" dir="rtl">
                  {habit.name_arabic}
                </p>
              )}
              {habit.duration_minutes && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {habit.duration_minutes} menit
                </p>
              )}
            </div>

            <Badge variant="secondary" className={`text-[10px] px-2 ${info.bgColor} ${info.color} border-0`}>
              {info.label.split(' ')[0]}
            </Badge>
          </div>

          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-500">{streak} hari berturut</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmartHabitCard;
