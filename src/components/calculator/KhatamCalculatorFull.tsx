import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, Clock, Target } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

const TOTAL_JUZ = 30;
const TOTAL_PAGES = 604;
const PRAYER_TIMES = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

interface KhatamData {
  mode: string;
  targetDays: number;
  startDate: string;
  currentJuz: number;
}

const getStored = (): KhatamData => {
  try {
    const d = localStorage.getItem('khatam_calculator_preset');
    return d ? JSON.parse(d) : { mode: 'custom', targetDays: 30, startDate: format(new Date(), 'yyyy-MM-dd'), currentJuz: 0 };
  } catch { return { mode: 'custom', targetDays: 30, startDate: format(new Date(), 'yyyy-MM-dd'), currentJuz: 0 }; }
};

const KhatamCalculatorFull = () => {
  const [data, setData] = useState<KhatamData>(getStored);
  const [mode, setMode] = useState(data.mode);

  const presets = [
    { id: '30days', label: '1 Juz/Hari', days: 30, desc: '30 hari — khatam 1 bulan' },
    { id: '10days', label: 'Cepat 10 Hari', days: 10, desc: '3 juz/hari — intensif' },
    { id: '7days', label: "I'tikaf 7 Hari", days: 7, desc: '~4.3 juz/hari — fokus penuh' },
    { id: 'custom', label: 'Custom', days: data.targetDays, desc: 'Pilih target sendiri' },
  ];

  const activeDays = mode === 'custom' ? data.targetDays : (presets.find(p => p.id === mode)?.days || 30);
  const pagesPerDay = Math.ceil(TOTAL_PAGES / activeDays);
  const juzPerDay = (TOTAL_JUZ / activeDays);
  const pagesPerPrayer = Math.ceil(pagesPerDay / 5);
  const targetDate = addDays(new Date(data.startDate), activeDays);
  const daysLeft = Math.max(0, differenceInDays(targetDate, new Date()));
  const progressPct = Math.min(100, (data.currentJuz / TOTAL_JUZ) * 100);

  useEffect(() => {
    const save = { ...data, mode, targetDays: activeDays };
    localStorage.setItem('khatam_calculator_preset', JSON.stringify(save));
  }, [data, mode, activeDays]);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress Khatam</span>
            <Badge variant="secondary">{data.currentJuz}/{TOTAL_JUZ} Juz</Badge>
          </div>
          <Progress value={progressPct} className="h-2.5 mb-3" />
          <div className="flex gap-2 items-center">
            <Label className="text-xs">Juz saat ini:</Label>
            <Input
              type="number" min={0} max={30} value={data.currentJuz}
              onChange={e => setData(d => ({ ...d, currentJuz: Math.min(30, Math.max(0, Number(e.target.value))) }))}
              className="w-20 h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map(p => (
          <Card
            key={p.id}
            className={`cursor-pointer transition-all ${mode === p.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
            onClick={() => setMode(p.id)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {mode === 'custom' && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-xs">Target hari</Label>
              <Input
                type="number" min={1} max={365} value={data.targetDays}
                onChange={e => setData(d => ({ ...d, targetDays: Math.max(1, Number(e.target.value)) }))}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Mulai dari tanggal</Label>
              <Input
                type="date" value={data.startDate}
                onChange={e => setData(d => ({ ...d, startDate: e.target.value }))}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" /> Target Harian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{pagesPerDay}</p>
              <p className="text-[10px] text-muted-foreground">halaman/hari</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{juzPerDay.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">juz/hari</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{daysLeft}</p>
              <p className="text-[10px] text-muted-foreground">hari tersisa</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Breakdown Per Waktu Sholat
            </p>
            <div className="space-y-1.5">
              {PRAYER_TIMES.map(time => (
                <div key={time} className="flex justify-between items-center bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-sm">{time}</span>
                  <Badge variant="outline" className="text-xs">{pagesPerPrayer} halaman</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            Estimasi khatam: <span className="font-semibold">{format(targetDate, 'd MMMM yyyy')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KhatamCalculatorFull;
