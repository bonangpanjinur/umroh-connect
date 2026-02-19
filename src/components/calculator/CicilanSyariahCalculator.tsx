import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Info } from 'lucide-react';

const CicilanSyariahCalculator = () => {
  const [hargaBarang, setHargaBarang] = useState(10_000_000);
  const [dp, setDp] = useState(2_000_000);
  const [tenor, setTenor] = useState(12); // bulan
  const [margin, setMargin] = useState(10); // persen total

  const sisaPokok = Math.max(0, hargaBarang - dp);
  const totalMargin = sisaPokok * (margin / 100);
  const totalBayar = sisaPokok + totalMargin;
  const cicilanBulanan = tenor > 0 ? Math.ceil(totalBayar / tenor) : 0;

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Akad Murabahah: penjual menyebutkan harga pokok + margin keuntungan secara transparan. Cicilan tetap tanpa bunga berubah.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-xs">Harga barang (Rp)</Label>
            <Input type="number" min={0} value={hargaBarang} onChange={e => setHargaBarang(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Uang muka / DP (Rp)</Label>
            <Input type="number" min={0} max={hargaBarang} value={dp} onChange={e => setDp(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Tenor (bulan)</Label>
            <Input type="number" min={1} max={120} value={tenor} onChange={e => setTenor(Math.max(1, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Margin keuntungan (%)</Label>
            <Input type="number" min={0} max={100} step={0.5} value={margin} onChange={e => setMargin(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="text-center">
            <CreditCard className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Cicilan per bulan</p>
            <p className="text-3xl font-bold text-primary">{fmt(cicilanBulanan)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground">Sisa pokok</p>
              <p className="font-semibold">{fmt(sisaPokok)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground">Total margin</p>
              <p className="font-semibold">{fmt(totalMargin)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 col-span-2">
              <p className="text-muted-foreground">Total bayar</p>
              <p className="font-semibold">{fmt(totalBayar)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CicilanSyariahCalculator;
