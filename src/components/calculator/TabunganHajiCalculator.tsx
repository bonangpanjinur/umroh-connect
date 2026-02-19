import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PiggyBank, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TabunganHajiCalculator = () => {
  const [targetBiaya, setTargetBiaya] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tabungan_haji_goal') || '{}').targetBiaya || 45_000_000; } catch { return 45_000_000; }
  });
  const [tabunganBulanan, setTabunganBulanan] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tabungan_haji_goal') || '{}').tabunganBulanan || 1_000_000; } catch { return 1_000_000; }
  });
  const [sudahTerkumpul, setSudahTerkumpul] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tabungan_haji_goal') || '{}').sudahTerkumpul || 0; } catch { return 0; }
  });

  const sisa = Math.max(0, targetBiaya - sudahTerkumpul);
  const bulanDibutuhkan = tabunganBulanan > 0 ? Math.ceil(sisa / tabunganBulanan) : 0;
  const tahunDibutuhkan = (bulanDibutuhkan / 12).toFixed(1);
  const progressPct = targetBiaya > 0 ? Math.min(100, (sudahTerkumpul / targetBiaya) * 100) : 0;

  useEffect(() => {
    localStorage.setItem('tabungan_haji_goal', JSON.stringify({ targetBiaya, tabunganBulanan, sudahTerkumpul }));
  }, [targetBiaya, tabunganBulanan, sudahTerkumpul]);

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress Tabungan</span>
            <span className="text-xs text-muted-foreground">{progressPct.toFixed(0)}%</span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">{fmt(sudahTerkumpul)} / {fmt(targetBiaya)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-xs">Target biaya haji (Rp)</Label>
            <Input type="number" min={0} value={targetBiaya} onChange={e => setTargetBiaya(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Sudah terkumpul (Rp)</Label>
            <Input type="number" min={0} value={sudahTerkumpul} onChange={e => setSudahTerkumpul(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Tabungan per bulan (Rp)</Label>
            <Input type="number" min={0} value={tabunganBulanan} onChange={e => setTabunganBulanan(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
        </CardContent>
      </Card>

      {sisa > 0 && tabunganBulanan > 0 && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold text-primary">{bulanDibutuhkan}</p>
                <p className="text-[10px] text-muted-foreground">bulan lagi</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold text-primary">{tahunDibutuhkan}</p>
                <p className="text-[10px] text-muted-foreground">tahun lagi</p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">Kekurangan: {fmt(sisa)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TabunganHajiCalculator;
