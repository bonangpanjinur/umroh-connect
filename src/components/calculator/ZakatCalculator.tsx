import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Gem, Users } from 'lucide-react';

const NISAB_EMAS_GRAM = 85; // gram
const HARGA_EMAS_PER_GRAM = 1_300_000; // approx
const HARGA_BERAS_PER_KG = 15_000;
const ZAKAT_FITRAH_KG = 2.5;

const ZakatCalculator = () => {
  // Penghasilan
  const [penghasilanBulanan, setPenghasilanBulanan] = useState(0);
  // Emas
  const [beratEmas, setBeratEmas] = useState(0);
  // Fitrah
  const [jumlahJiwa, setJumlahJiwa] = useState(1);
  const [hargaBeras, setHargaBeras] = useState(HARGA_BERAS_PER_KG);

  const penghasilanTahunan = penghasilanBulanan * 12;
  const nisabPenghasilan = NISAB_EMAS_GRAM * HARGA_EMAS_PER_GRAM;
  const wajibZakatPenghasilan = penghasilanTahunan >= nisabPenghasilan;
  const zakatPenghasilan = wajibZakatPenghasilan ? penghasilanTahunan * 0.025 : 0;
  const zakatPenghasilanBulanan = wajibZakatPenghasilan ? penghasilanBulanan * 0.025 : 0;

  const nilaiEmas = beratEmas * HARGA_EMAS_PER_GRAM;
  const wajibZakatEmas = beratEmas >= NISAB_EMAS_GRAM;
  const zakatEmas = wajibZakatEmas ? nilaiEmas * 0.025 : 0;

  const zakatFitrahPerJiwa = ZAKAT_FITRAH_KG * hargaBeras;
  const totalZakatFitrah = zakatFitrahPerJiwa * jumlahJiwa;

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="penghasilan">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="penghasilan" className="text-xs gap-1"><Wallet className="w-3.5 h-3.5" /> Penghasilan</TabsTrigger>
          <TabsTrigger value="emas" className="text-xs gap-1"><Gem className="w-3.5 h-3.5" /> Emas</TabsTrigger>
          <TabsTrigger value="fitrah" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Fitrah</TabsTrigger>
        </TabsList>

        <TabsContent value="penghasilan" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Penghasilan per bulan (Rp)</Label>
                <Input type="number" min={0} value={penghasilanBulanan} onChange={e => setPenghasilanBulanan(Math.max(0, Number(e.target.value)))} className="h-9" />
              </div>
              <p className="text-[10px] text-muted-foreground">Nisab: {fmt(nisabPenghasilan)}/tahun ({NISAB_EMAS_GRAM}g emas)</p>
            </CardContent>
          </Card>
          {penghasilanBulanan > 0 && (
            <Card className={wajibZakatPenghasilan ? 'border-primary/30' : 'border-muted'}>
              <CardContent className="p-4 text-center">
                {wajibZakatPenghasilan ? (
                  <>
                    <p className="text-sm text-muted-foreground">Zakat Penghasilan (2.5%)</p>
                    <p className="text-3xl font-bold text-primary">{fmt(zakatPenghasilanBulanan)}<span className="text-sm font-normal">/bulan</span></p>
                    <p className="text-xs text-muted-foreground mt-1">atau {fmt(zakatPenghasilan)}/tahun</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Penghasilan belum mencapai nisab</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="emas" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Berat emas yang dimiliki (gram)</Label>
                <Input type="number" min={0} step={0.1} value={beratEmas} onChange={e => setBeratEmas(Math.max(0, Number(e.target.value)))} className="h-9" />
              </div>
              <p className="text-[10px] text-muted-foreground">Nisab: {NISAB_EMAS_GRAM}g emas (≈ {fmt(nisabPenghasilan)}). Harus dimiliki 1 tahun (haul).</p>
            </CardContent>
          </Card>
          {beratEmas > 0 && (
            <Card className={wajibZakatEmas ? 'border-primary/30' : 'border-muted'}>
              <CardContent className="p-4 text-center">
                {wajibZakatEmas ? (
                  <>
                    <p className="text-sm text-muted-foreground">Zakat Emas (2.5%)</p>
                    <p className="text-3xl font-bold text-primary">{fmt(zakatEmas)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Nilai emas: {fmt(nilaiEmas)}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Emas belum mencapai nisab ({NISAB_EMAS_GRAM}g)</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fitrah" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Jumlah jiwa dalam keluarga</Label>
                <Input type="number" min={1} value={jumlahJiwa} onChange={e => setJumlahJiwa(Math.max(1, Number(e.target.value)))} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Harga beras per kg (Rp)</Label>
                <Input type="number" min={0} value={hargaBeras} onChange={e => setHargaBeras(Math.max(0, Number(e.target.value)))} className="h-9" />
              </div>
              <p className="text-[10px] text-muted-foreground">Zakat fitrah = {ZAKAT_FITRAH_KG}kg beras × harga beras × jiwa</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Zakat Fitrah</p>
              <p className="text-3xl font-bold text-primary">{fmt(totalZakatFitrah)}</p>
              <p className="text-xs text-muted-foreground mt-1">{jumlahJiwa} jiwa × {fmt(zakatFitrahPerJiwa)}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ZakatCalculator;
