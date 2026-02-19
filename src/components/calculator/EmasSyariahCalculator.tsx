import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gem, TrendingUp } from 'lucide-react';

const EmasSyariahCalculator = () => {
  const [hargaEmasPerGram, setHargaEmasPerGram] = useState(1_300_000);
  const [targetGram, setTargetGram] = useState(10);
  const [cicilanBulanan, setCicilanBulanan] = useState(500_000);

  const totalHarga = hargaEmasPerGram * targetGram;
  const bulanDibutuhkan = cicilanBulanan > 0 ? Math.ceil(totalHarga / cicilanBulanan) : 0;
  const gramPerBulan = cicilanBulanan > 0 ? (cicilanBulanan / hargaEmasPerGram) : 0;

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-xs">Harga emas per gram (Rp)</Label>
            <Input type="number" min={0} value={hargaEmasPerGram} onChange={e => setHargaEmasPerGram(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Target beli (gram)</Label>
            <Input type="number" min={0.1} step={0.1} value={targetGram} onChange={e => setTargetGram(Math.max(0.1, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Cicilan per bulan (Rp)</Label>
            <Input type="number" min={0} value={cicilanBulanan} onChange={e => setCicilanBulanan(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="text-center">
            <Gem className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-sm text-muted-foreground">Total Harga {targetGram}g Emas</p>
            <p className="text-3xl font-bold text-primary">{fmt(totalHarga)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-primary">{bulanDibutuhkan}</p>
              <p className="text-[10px] text-muted-foreground">bulan cicilan</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <Gem className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-xl font-bold text-primary">{gramPerBulan.toFixed(2)}g</p>
              <p className="text-[10px] text-muted-foreground">emas/bulan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmasSyariahCalculator;
