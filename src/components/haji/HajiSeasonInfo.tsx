import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { getHajiSeasonInfo } from '@/hooks/useHaji';

export const HajiSeasonInfo = () => {
  const seasonInfo = getHajiSeasonInfo();

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Informasi Musim Haji
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">Haji Tahun Depan</span>
            </div>
            <p className="text-lg font-bold text-amber-900">
              {seasonInfo.nextHajiYear} M
            </p>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs font-medium">Perkiraan Bulan</span>
            </div>
            <p className="text-lg font-bold text-amber-900">
              {seasonInfo.estimatedHajiMonths.join(' - ')}
            </p>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">Estimasi Antrean Haji Reguler</span>
            </div>
            <p className="text-sm text-amber-800">
              Rata-rata waktu tunggu <span className="font-bold">{seasonInfo.regularWaitingYears}+ tahun</span> tergantung daerah
            </p>
          </div>
        </div>

        {seasonInfo.isHajiSeason && (
          <div className="mt-3 bg-amber-100 text-amber-800 text-xs p-2 rounded-lg text-center font-medium">
            🕋 Sedang Musim Haji {seasonInfo.currentYear}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
