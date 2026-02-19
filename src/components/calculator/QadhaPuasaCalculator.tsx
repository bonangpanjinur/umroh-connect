import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

const QadhaPuasaCalculator = () => {
  const [totalHutang, setTotalHutang] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qadha_puasa_data') || '{}').totalHutang || 0; } catch { return 0; }
  });
  const [sudahQadha, setSudahQadha] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qadha_puasa_data') || '{}').sudahQadha || 0; } catch { return 0; }
  });
  const [targetPerMinggu, setTargetPerMinggu] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qadha_puasa_data') || '{}').targetPerMinggu || 2; } catch { return 2; }
  });

  const sisaHutang = Math.max(0, totalHutang - sudahQadha);
  const mingguDibutuhkan = targetPerMinggu > 0 ? Math.ceil(sisaHutang / targetPerMinggu) : 0;
  const estimasiSelesai = addDays(new Date(), mingguDibutuhkan * 7);
  const progressPct = totalHutang > 0 ? Math.min(100, (sudahQadha / totalHutang) * 100) : 0;

  useEffect(() => {
    localStorage.setItem('qadha_puasa_data', JSON.stringify({ totalHutang, sudahQadha, targetPerMinggu }));
  }, [totalHutang, sudahQadha, targetPerMinggu]);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress Qadha</span>
            <Badge variant="secondary">{sudahQadha}/{totalHutang} hari</Badge>
          </div>
          <Progress value={progressPct} className="h-2.5" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Input Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Total hutang puasa (hari)</Label>
            <Input type="number" min={0} value={totalHutang} onChange={e => setTotalHutang(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Sudah di-qadha (hari)</Label>
            <Input type="number" min={0} max={totalHutang} value={sudahQadha} onChange={e => setSudahQadha(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Target puasa per minggu</Label>
            <Input type="number" min={1} max={7} value={targetPerMinggu} onChange={e => setTargetPerMinggu(Math.max(1, Math.min(7, Number(e.target.value))))} className="h-9" />
            <p className="text-[10px] text-muted-foreground mt-1">Rekomendasi: Senin & Kamis (2x/minggu)</p>
          </div>
        </CardContent>
      </Card>

      {sisaHutang > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" /> Estimasi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">{sisaHutang}</p>
                <p className="text-[10px] text-muted-foreground">hari tersisa</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">{mingguDibutuhkan}</p>
                <p className="text-[10px] text-muted-foreground">minggu lagi</p>
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Estimasi selesai: <span className="font-semibold">{format(estimasiSelesai, 'd MMMM yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {sisaHutang === 0 && totalHutang > 0 && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">Alhamdulillah! Hutang puasa lunas 🎉</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QadhaPuasaCalculator;
