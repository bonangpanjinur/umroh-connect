import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Info } from 'lucide-react';

const FidyahCalculator = () => {
  const [hariTidakPuasa, setHariTidakPuasa] = useState(0);
  const [hargaMakanan, setHargaMakanan] = useState(35000); // avg per meal

  const totalFidyah = hariTidakPuasa * hargaMakanan;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Fidyah wajib bagi yang tidak mampu berpuasa karena sakit kronis, usia lanjut, atau kondisi permanen. Besarannya 1 mud makanan pokok (~750gr beras) per hari.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Hitung Fidyah</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Jumlah hari tidak puasa</Label>
            <Input type="number" min={0} value={hariTidakPuasa} onChange={e => setHariTidakPuasa(Math.max(0, Number(e.target.value)))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Harga makanan per hari (Rp)</Label>
            <Input type="number" min={0} value={hargaMakanan} onChange={e => setHargaMakanan(Math.max(0, Number(e.target.value)))} className="h-9" />
            <p className="text-[10px] text-muted-foreground mt-1">Setara 1 mud beras (~750gr) atau 1 porsi makanan layak</p>
          </div>
        </CardContent>
      </Card>

      {hariTidakPuasa > 0 && (
        <Card className="border-primary/30">
          <CardContent className="p-4 text-center">
            <Coins className="w-10 h-10 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Total Fidyah</p>
            <p className="text-3xl font-bold text-primary">
              Rp {totalFidyah.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {hariTidakPuasa} hari × Rp {hargaMakanan.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FidyahCalculator;
