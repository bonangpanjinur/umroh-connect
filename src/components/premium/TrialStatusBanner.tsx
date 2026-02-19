import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Crown, Clock, Gift } from 'lucide-react';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { useIsPremium } from '@/hooks/usePremiumSubscription';
import { useAuthContext } from '@/contexts/AuthContext';

interface TrialStatusBannerProps {
  onUpgrade: () => void;
  onNavigateToAuth?: () => void;
}

const TrialStatusBanner = ({ onUpgrade, onNavigateToAuth }: TrialStatusBannerProps) => {
  const { user } = useAuthContext();
  const { isPremium } = useIsPremium();
  const { isInTrial, daysRemaining, hasEverStartedTrial, hasTrialExpired, startTrial } = useFreeTrial();

  // Already premium - show badge only
  if (isPremium) {
    return (
      <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-200">
        <CardContent className="py-2.5 px-4 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">Anda adalah member Premium</span>
          <Badge className="bg-amber-500 text-white text-[10px] ml-auto">PREMIUM</Badge>
        </CardContent>
      </Card>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">Login untuk coba Premium 30 hari gratis</span>
          </div>
          <Button size="sm" className="h-7 text-[10px]" onClick={onNavigateToAuth}>
            Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active trial
  if (isInTrial) {
    const trialProgress = ((30 - daysRemaining) / 30) * 100;
    return (
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-200">
        <CardContent className="py-3 px-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold text-violet-700">Premium Trial Aktif</span>
            </div>
            <Badge className="bg-violet-500 text-white text-[10px]">{daysRemaining} hari tersisa</Badge>
          </div>
          <Progress value={trialProgress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            Nikmati semua fitur premium. Upgrade sebelum habis agar data tetap tersimpan.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Trial expired
  if (hasTrialExpired) {
    return (
      <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-200">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-700">⏰ Trial Berakhir</p>
            <p className="text-[10px] text-muted-foreground">Upgrade untuk akses penuh kembali</p>
          </div>
          <Button size="sm" className="h-7 text-[10px] bg-red-600 hover:bg-red-700" onClick={onUpgrade}>
            Upgrade Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Never started trial
  if (!hasEverStartedTrial) {
    return (
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Coba Premium 30 Hari Gratis!
            </p>
            <p className="text-[10px] text-muted-foreground">Cloud sync, kalkulator khatam, tips eksklusif</p>
          </div>
          <Button 
            size="sm" 
            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
            onClick={() => startTrial.mutate()}
            disabled={startTrial.isPending}
          >
            {startTrial.isPending ? '...' : 'Mulai Trial'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default TrialStatusBanner;
