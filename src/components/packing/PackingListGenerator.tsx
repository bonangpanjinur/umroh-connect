import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Sparkles, Sun, Cloud, ThermometerSun,
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Lightbulb, Calendar, User, Clock, Share2, FileText,
  MessageCircle, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface PackingItem {
  name: string;
  quantity: string;
  priority: 'high' | 'medium' | 'low';
  weather_note?: string;
}

interface PackingCategory {
  name: string;
  icon: string;
  items: PackingItem[];
}

interface PackingList {
  weather_summary: string;
  categories: PackingCategory[];
  tips: string[];
}

interface WeatherData {
  makkah: { temp: number; condition: string; humidity: number };
  madinah: { temp: number; condition: string; humidity: number };
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const priorityLabels = {
  high: 'Wajib',
  medium: 'Penting',
  low: 'Opsional',
};

interface PackingListGeneratorProps {
  onBack?: () => void;
}

const PackingListGenerator = ({ onBack }: PackingListGeneratorProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'result'>('form');
  
  // Form state
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Result state
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const duration = departureDate && returnDate 
    ? differenceInDays(new Date(returnDate), new Date(departureDate)) + 1
    : 0;

  const handleGenerate = async () => {
    if (!departureDate || !returnDate) {
      toast({
        title: 'Lengkapi Data',
        description: 'Masukkan tanggal keberangkatan dan kepulangan',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-packing-list', {
        body: {
          departureDate,
          returnDate,
          gender,
          duration,
        },
      });

      if (error) throw error;

      if (data.success) {
        setPackingList(data.packing_list);
        setWeather(data.weather);
        // Expand all categories by default
        setExpandedCategories(new Set(data.packing_list.categories.map((c: PackingCategory) => c.name)));
        setStep('result');
      } else {
        throw new Error(data.error || 'Failed to generate packing list');
      }
    } catch (error) {
      console.error('Error generating packing list:', error);
      toast({
        title: 'Gagal Membuat Daftar',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const totalItems = packingList?.categories.reduce((sum, cat) => sum + cat.items.length, 0) || 0;
  const checkedCount = checkedItems.size;

  // Generate text for sharing
  const generateShareText = () => {
    if (!packingList) return '';
    
    let text = `📦 *PACKING LIST UMROH*\n`;
    text += `📅 ${format(new Date(departureDate), 'd MMM', { locale: idLocale })} - ${format(new Date(returnDate), 'd MMM yyyy', { locale: idLocale })}\n`;
    text += `⏱️ Durasi: ${duration} hari\n\n`;
    
    if (weather) {
      text += `🌡️ *Cuaca:*\n`;
      text += `Makkah: ${weather.makkah.temp}°C (${weather.makkah.condition})\n`;
      text += `Madinah: ${weather.madinah.temp}°C (${weather.madinah.condition})\n\n`;
    }
    
    packingList.categories.forEach(cat => {
      text += `${cat.icon} *${cat.name}*\n`;
      cat.items.forEach(item => {
        const checked = checkedItems.has(`${cat.name}-${item.name}`);
        const checkbox = checked ? '✅' : '⬜';
        const priority = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
        text += `${checkbox} ${item.name} ${priority}`;
        if (item.quantity) text += ` (${item.quantity})`;
        text += `\n`;
      });
      text += `\n`;
    });
    
    if (packingList.tips.length > 0) {
      text += `💡 *Tips:*\n`;
      packingList.tips.forEach(tip => {
        text += `• ${tip}\n`;
      });
    }
    
    text += `\n📱 _Dibuat dengan Arah Umroh App_`;
    return text;
  };

  // Share to WhatsApp
  const shareToWhatsApp = () => {
    const text = generateShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({ title: 'Membuka WhatsApp...' });
  };

  // Download as PDF (using print)
  const downloadAsPDF = () => {
    const text = generateShareText();
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Pop-up diblokir', description: 'Izinkan pop-up untuk download PDF', variant: 'destructive' });
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing List Umroh</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #10b981; margin-bottom: 5px; }
          h2 { color: #333; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .date { color: #666; font-size: 14px; }
          .weather { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .weather-item { text-align: center; }
          .weather-temp { font-size: 24px; font-weight: bold; color: #10b981; }
          .category { margin-bottom: 20px; }
          .item { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px; }
          .checkbox { width: 18px; height: 18px; border: 2px solid #10b981; border-radius: 3px; }
          .checkbox.checked { background: #10b981; }
          .priority-high { color: #ef4444; font-size: 12px; }
          .priority-medium { color: #f59e0b; font-size: 12px; }
          .priority-low { color: #22c55e; font-size: 12px; }
          .tips { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Packing List Umroh</h1>
          <p class="date">📅 ${format(new Date(departureDate), 'd MMMM yyyy', { locale: idLocale })} - ${format(new Date(returnDate), 'd MMMM yyyy', { locale: idLocale })}</p>
          <p class="date">⏱️ Durasi: ${duration} hari | 👤 ${gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
        </div>
        
        ${weather ? `
        <div class="weather">
          <h2>🌡️ Prediksi Cuaca</h2>
          <div class="weather-grid">
            <div class="weather-item">
              <div>Makkah</div>
              <div class="weather-temp">${weather.makkah.temp}°C</div>
              <div>${weather.makkah.condition}</div>
            </div>
            <div class="weather-item">
              <div>Madinah</div>
              <div class="weather-temp">${weather.madinah.temp}°C</div>
              <div>${weather.madinah.condition}</div>
            </div>
          </div>
        </div>
        ` : ''}
        
        ${packingList?.categories.map(cat => `
          <div class="category">
            <h2>${cat.icon} ${cat.name}</h2>
            ${cat.items.map(item => {
              const isChecked = checkedItems.has(`${cat.name}-${item.name}`);
              const priorityClass = `priority-${item.priority}`;
              const priorityLabel = item.priority === 'high' ? 'Wajib' : item.priority === 'medium' ? 'Penting' : 'Opsional';
              return `
                <div class="item">
                  <div class="checkbox ${isChecked ? 'checked' : ''}"></div>
                  <span>${item.name}</span>
                  <span class="${priorityClass}">${priorityLabel}</span>
                  ${item.quantity ? `<span style="color:#666">(${item.quantity})</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `).join('') || ''}
        
        ${packingList?.tips && packingList.tips.length > 0 ? `
        <div class="tips">
          <h2>💡 Tips Packing</h2>
          <ul>
            ${packingList.tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Dibuat dengan ❤️ oleh Arah Umroh App</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast({ title: 'Menyiapkan PDF...' });
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Disalin ke clipboard!' });
    } catch (error) {
      toast({ title: 'Gagal menyalin', variant: 'destructive' });
    }
  };

  // Form view
  if (step === 'form') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Packing List Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Dapatkan rekomendasi packing list berdasarkan cuaca di Makkah & Madinah
            </p>

            {/* Date inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="departure" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Berangkat
                </Label>
                <Input
                  id="departure"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Pulang
                </Label>
                <Input
                  id="return"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate}
                />
              </div>
            </div>

            {duration > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Durasi: {duration} hari
              </div>
            )}

            {/* Gender selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Jenis Kelamin
              </Label>
              <RadioGroup
                value={gender}
                onValueChange={(v) => setGender(v as 'male' | 'female')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal">Laki-laki</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal">Perempuan</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={isLoading || !departureDate || !returnDate}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menganalisis Cuaca...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Packing List
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Result view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header with progress */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Packing List Anda</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(departureDate), 'd MMM', { locale: idLocale })} - {format(new Date(returnDate), 'd MMM yyyy', { locale: idLocale })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={shareToWhatsApp}>
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    Kirim via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadAsPDF}>
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyToClipboard}>
                    <Download className="w-4 h-4 mr-2" />
                    Salin ke Clipboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Badge variant="secondary">
                {checkedCount}/{totalItems} item
              </Badge>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weather info */}
      {weather && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ThermometerSun className="w-5 h-5 text-amber-500" />
              <h4 className="font-medium">Prediksi Cuaca</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Makkah</p>
                <p className="font-semibold text-lg">{weather.makkah.temp}°C</p>
                <p className="text-xs">{weather.makkah.condition}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Madinah</p>
                <p className="font-semibold text-lg">{weather.madinah.temp}°C</p>
                <p className="text-xs">{weather.madinah.condition}</p>
              </div>
            </div>
            {packingList?.weather_summary && (
              <p className="text-sm text-muted-foreground mt-3">
                {packingList.weather_summary}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Packing categories */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {packingList?.categories.map((category) => (
            <Collapsible
              key={category.name}
              open={expandedCategories.has(category.name)}
              onOpenChange={() => toggleCategory(category.name)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.icon}</span>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {category.items.filter(i => checkedItems.has(`${category.name}-${i.name}`)).length}/{category.items.length}
                        </Badge>
                      </div>
                      {expandedCategories.has(category.name) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <AnimatePresence>
                      {category.items.map((item, index) => {
                        const itemId = `${category.name}-${item.name}`;
                        const isChecked = checkedItems.has(itemId);
                        
                        return (
                          <motion.div
                            key={itemId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex items-start gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                              isChecked ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleItem(itemId)}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                  {item.name}
                                </span>
                                <Badge variant="outline" className={`text-xs ${priorityColors[item.priority]}`}>
                                  {priorityLabels[item.priority]}
                                </Badge>
                                {item.quantity && (
                                  <span className="text-xs text-muted-foreground">
                                    ({item.quantity})
                                  </span>
                                )}
                              </div>
                              {item.weather_note && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Sun className="w-3 h-3" />
                                  {item.weather_note}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Tips */}
      {packingList?.tips && packingList.tips.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Tips Packing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ul className="space-y-2">
              {packingList.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
          Buat Ulang
        </Button>
        <Button className="flex-1" onClick={onBack}>
          Selesai
        </Button>
      </div>
    </motion.div>
  );
};

export default PackingListGenerator;
