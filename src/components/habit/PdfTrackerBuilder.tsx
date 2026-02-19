import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Printer, Flame, Dumbbell, Utensils, Heart, BookOpen, Layers,
  Lock, Crown, Sparkles, FileDown, Eye
} from 'lucide-react';
import PdfTrackerPreview from './PdfTrackerPreview';
import { useIsPremium } from '@/hooks/usePremiumSubscription';
import { generateTracker, type TrackerType, type TrackerPeriod, type TrackerTheme, type TrackerConfig } from '@/utils/generateHabitPdf';

interface PdfTrackerBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowPremium: () => void;
}

const trackerTypes: { id: TrackerType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'ibadah', label: 'Ibadah', icon: <Flame className="w-4 h-4" />, desc: 'Checklist sholat, dzikir, tilawah' },
  { id: 'olahraga', label: 'Olahraga', icon: <Dumbbell className="w-4 h-4" />, desc: 'Log jenis, durasi, intensitas' },
  { id: 'makanan', label: 'Makanan', icon: <Utensils className="w-4 h-4" />, desc: 'Sahur, berbuka, air' },
  { id: 'sedekah', label: 'Sedekah', icon: <Heart className="w-4 h-4" />, desc: 'Jenis, nominal, penerima' },
  { id: 'tadarus', label: 'Tadarus', icon: <BookOpen className="w-4 h-4" />, desc: 'Grid 30 juz + log ayat' },
  { id: 'all-in-one', label: 'All-in-One', icon: <Layers className="w-4 h-4" />, desc: 'Gabungan semua kategori' },
];

const themes: { id: TrackerTheme; label: string; color: string }[] = [
  { id: 'green', label: 'Hijau', color: 'bg-emerald-500' },
  { id: 'blue', label: 'Biru', color: 'bg-blue-500' },
  { id: 'gold', label: 'Emas', color: 'bg-amber-500' },
  { id: 'custom', label: 'Ungu', color: 'bg-violet-500' },
];

export const PdfTrackerBuilder = ({ open, onOpenChange, onShowPremium }: PdfTrackerBuilderProps) => {
  const { isPremium } = useIsPremium();
  const [selectedType, setSelectedType] = useState<TrackerType>('ibadah');
  const [period, setPeriod] = useState<TrackerPeriod>('monthly');
  const [theme, setTheme] = useState<TrackerTheme>('green');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [userName, setUserName] = useState('');
  const [whitelabel, setWhitelabel] = useState(false);
  const [tagline, setTagline] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | undefined>();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!isPremium) {
      onShowPremium();
      return;
    }
    const config: TrackerConfig = {
      type: selectedType,
      period,
      theme,
      orientation: selectedType === 'all-in-one' ? 'landscape' : orientation,
      userName: userName || undefined,
      whitelabel,
      tagline: tagline || undefined,
      logoBase64,
    };
    generateTracker(config);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Printer className="w-5 h-5" />
            Cetak Tracker Offline
            {!isPremium && (
              <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                <Crown className="w-3 h-3" /> Premium
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Tracker Type Selection */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Pilih Jenis Tracker</Label>
            <div className="grid grid-cols-3 gap-2">
              {trackerTypes.map(t => (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all ${
                    selectedType === t.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedType(t.id)}
                >
                  <CardContent className="p-2.5 text-center">
                    <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      selectedType === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {t.icon}
                    </div>
                    <p className="text-[11px] font-medium">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{t.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Period & Orientation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Periode</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as TrackerPeriod)}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Mingguan (7 hari)</SelectItem>
                  <SelectItem value="monthly">Bulanan (30 hari)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Orientasi</Label>
              <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Theme */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tema Warna</Label>
            <div className="flex gap-2">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    theme === t.id 
                      ? 'border-primary bg-primary/10 font-medium' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Name */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Nama (opsional)</Label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Nama di header PDF"
              className="h-9 text-xs mt-1"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Upload Logo (opsional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="h-9 text-[11px] mt-1"
            />
            {logoBase64 && (
              <p className="text-[10px] text-emerald-600 mt-1">✓ Logo ter-upload</p>
            )}
          </div>

          {/* Whitelabel (Premium) */}
          <Card className={`transition-all ${whitelabel ? 'border-primary/50 bg-primary/5' : 'bg-muted/30'}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs font-medium">Whitelabel</p>
                    <p className="text-[10px] text-muted-foreground">Hapus branding UmrohConnect</p>
                  </div>
                </div>
                <Switch
                  checked={whitelabel}
                  onCheckedChange={(v) => {
                    if (!isPremium) { onShowPremium(); return; }
                    setWhitelabel(v);
                  }}
                />
              </div>

              {whitelabel && isPremium && (
                <div className="pt-2 mt-2 border-t">
                  <Label className="text-[10px] text-muted-foreground">Tagline Footer</Label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Nama travel / tagline"
                    className="h-8 text-[10px] mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>


          {/* Preview */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Preview Template
            </Label>
            <div className="max-w-[200px] mx-auto">
              <PdfTrackerPreview
                type={selectedType}
                period={period}
                theme={theme}
                userName={userName}
                whitelabel={whitelabel}
                tagline={tagline}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            className="w-full h-11 gap-2"
            size="lg"
          >
            {isPremium ? (
              <>
                <FileDown className="w-4 h-4" />
                Download PDF
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Upgrade untuk Download
              </>
            )}
          </Button>

          {!isPremium && (
            <p className="text-[10px] text-center text-muted-foreground">
              Fitur cetak tracker memerlukan langganan Premium
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PdfTrackerBuilder;
