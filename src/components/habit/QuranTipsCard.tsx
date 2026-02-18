import { Card, CardContent } from '@/components/ui/card';
import { useTodayTip } from '@/hooks/useQuranTips';
import { Lightbulb, RefreshCw } from 'lucide-react';

const QuranTipsCard = () => {
  const todayTip = useTodayTip();

  if (!todayTip) return null;

  const categoryColors: Record<string, string> = {
    motivasi: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    teknik: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    adab: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    keutamaan: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  };

  return (
    <Card className="border-none bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{todayTip.title}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${categoryColors[todayTip.category] || categoryColors.motivasi}`}>
                {todayTip.category}
              </span>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              {todayTip.content}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end mt-2">
          <span className="text-[9px] text-amber-600/50 flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5" />
            Tips berubah setiap hari
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuranTipsCard;
