import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Compass, Fingerprint, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useManasikGuides } from '@/hooks/useManasikGuides';

interface UmrahQuickCardProps {
  onNavigateBelajar: () => void;
  onMenuClick?: (menuId: string) => void;
}

const UmrahQuickCard = ({ onNavigateBelajar, onMenuClick }: UmrahQuickCardProps) => {
  const { data: guides = [] } = useManasikGuides('umroh');

  const completedSteps = (() => {
    try {
      const saved = localStorage.getItem('manasik_completed');
      return saved ? JSON.parse(saved) as string[] : [];
    } catch { return []; }
  })();

  const completedCount = completedSteps.filter(id => guides.some(g => g.id === id)).length;
  const progress = guides.length > 0 ? Math.round((completedCount / guides.length) * 100) : 0;

  const quickActions = [
    { id: 'doaharian', label: 'Doa', icon: BookOpen },
    { id: 'qibla', label: 'Kiblat', icon: Compass },
    { id: 'tasbih', label: 'Tasbih', icon: Fingerprint },
  ];

  return (
    <div className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5">
          <CardContent className="py-4 px-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Belajar Umroh</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {completedCount} dari {guides.length} langkah dipelajari
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs gap-1"
                onClick={onNavigateBelajar}
              >
                Lanjut
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Progress */}
            <Progress value={progress} className="h-1.5" />

            {/* Quick Actions */}
            <div className="flex gap-2">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-[10px] gap-1 bg-background/60"
                    onClick={() => onMenuClick?.(action.id)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UmrahQuickCard;
