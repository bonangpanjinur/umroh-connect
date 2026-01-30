import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDzikirStats, useDzikirTypes, useTodayDzikirLogs } from '@/hooks/useDzikirTracking';
import { Circle, TrendingUp, Zap, ExternalLink } from 'lucide-react';

interface DzikirStatsViewProps {
  onOpenTasbih?: () => void;
}

const DzikirStatsView = ({ onOpenTasbih }: DzikirStatsViewProps) => {
  const { user } = useAuthContext();
  const stats = useDzikirStats(user?.id);
  const { data: dzikirTypes } = useDzikirTypes();
  const { data: todayLogs } = useTodayDzikirLogs(user?.id);

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          Silakan login untuk melihat statistik dzikir
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Hari Ini</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats.totalDzikirToday}</p>
            <p className="text-xs text-muted-foreground">{stats.sessionsToday} sesi</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-muted-foreground">7 Hari</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{stats.totalDzikirWeek}</p>
            <p className="text-xs text-muted-foreground">total dzikir</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Tasbih Digital CTA */}
      {onOpenTasbih && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Tasbih Digital</h3>
                <p className="text-sm text-muted-foreground">Buka untuk dzikir & otomatis tercatat</p>
              </div>
              <Button onClick={onOpenTasbih} className="gap-2">
                <Zap className="w-4 h-4" />
                Buka
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dzikir Types Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Statistik per Dzikir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.statsByType.length > 0 ? (
            stats.statsByType.map((stat, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{stat.name}</span>
                    {stat.nameArabic && (
                      <span className="text-xs text-muted-foreground ml-2 font-arabic">
                        {stat.nameArabic}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary">{stat.totalCount}x</Badge>
                </div>
                <Progress 
                  value={Math.min((stat.totalCount / 1000) * 100, 100)} 
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground">{stat.sessions} sesi</p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada data dzikir</p>
              <p className="text-xs">Mulai dzikir dengan Tasbih Digital</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Dzikir Types (Admin Managed) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Daftar Dzikir
            <Badge variant="outline" className="text-xs">
              Dikelola Admin
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {dzikirTypes?.map(type => (
              <div 
                key={type.id}
                className="p-3 bg-muted/30 rounded-lg text-center"
              >
                <p className="font-arabic text-lg mb-1">{type.name_arabic}</p>
                <p className="text-xs font-medium">{type.name}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  Target: {type.default_target}x
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DzikirStatsView;
