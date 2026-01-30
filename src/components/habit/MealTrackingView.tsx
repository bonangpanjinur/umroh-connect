import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Moon, Sun, Droplets, Utensils, Check, X, Leaf, Apple,
  Coffee, Soup, UtensilsCrossed, ChevronRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

// Local storage for meal tracking
const STORAGE_KEY = 'meal_tracking_logs';
const FASTING_KEY = 'sunnah_fasting_logs';

interface MealLog {
  date: string;
  mealType: 'sahur' | 'iftar' | 'breakfast' | 'lunch' | 'dinner';
  waterGlasses: number;
  proteinSource?: string;
  carbSource?: string;
  vegetables?: string;
  fruits?: string;
  notes?: string;
  isHealthy: boolean;
  isSkipped: boolean;
  timestamp: number;
}

interface FastingLog {
  date: string;
  type: 'senin-kamis' | 'ayyamul-bidh' | 'daud' | 'arafah' | 'asyura' | 'custom';
  isCompleted: boolean;
  notes?: string;
}

interface MealFormData {
  waterGlasses: number;
  proteinSource: string;
  carbSource: string;
  vegetables: string;
  fruits: string;
  notes: string;
}

const defaultFormData: MealFormData = {
  waterGlasses: 2,
  proteinSource: '',
  carbSource: '',
  vegetables: '',
  fruits: '',
  notes: '',
};

const sunnahFastingTypes = [
  { id: 'senin-kamis' as const, label: 'Senin-Kamis', desc: 'Puasa rutin mingguan', icon: '📅' },
  { id: 'ayyamul-bidh' as const, label: 'Ayyamul Bidh', desc: 'Tgl 13, 14, 15 Hijriah', icon: '🌕' },
  { id: 'daud' as const, label: 'Puasa Daud', desc: 'Sehari puasa, sehari tidak', icon: '⚡' },
  { id: 'arafah' as const, label: 'Arafah', desc: '9 Dzulhijjah', icon: '🕋' },
  { id: 'asyura' as const, label: 'Asyura', desc: '10 Muharram', icon: '✨' },
  { id: 'custom' as const, label: 'Lainnya', desc: 'Puasa sunnah lainnya', icon: '🌙' },
];

interface MealTrackingViewProps {
  isRamadhanMode?: boolean;
}

const MealTrackingView = ({ isRamadhanMode = false }: MealTrackingViewProps) => {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealLog['mealType'] | null>(null);
  const [formData, setFormData] = useState<MealFormData>(defaultFormData);
  const [isFastingToday, setIsFastingToday] = useState(false);
  const [selectedFastingType, setSelectedFastingType] = useState<FastingLog['type'] | null>(null);

  // Define meal types based on mode and fasting status
  const getMealTypes = () => {
    if (isRamadhanMode) {
      return [
        { id: 'sahur' as const, label: 'Sahur', icon: Moon, color: 'from-indigo-500/10 to-purple-500/10', iconColor: 'text-indigo-600' },
        { id: 'iftar' as const, label: 'Berbuka', icon: Sun, color: 'from-amber-500/10 to-orange-500/10', iconColor: 'text-amber-600' },
      ];
    }
    if (isFastingToday) {
      return [
        { id: 'sahur' as const, label: 'Sahur', icon: Moon, color: 'from-indigo-500/10 to-purple-500/10', iconColor: 'text-indigo-600' },
        { id: 'iftar' as const, label: 'Berbuka', icon: Sun, color: 'from-amber-500/10 to-orange-500/10', iconColor: 'text-amber-600' },
      ];
    }
    return [
      { id: 'breakfast' as const, label: 'Sarapan', icon: Coffee, color: 'from-amber-500/10 to-yellow-500/10', iconColor: 'text-amber-600' },
      { id: 'lunch' as const, label: 'Makan Siang', icon: Soup, color: 'from-green-500/10 to-emerald-500/10', iconColor: 'text-green-600' },
      { id: 'dinner' as const, label: 'Makan Malam', icon: UtensilsCrossed, color: 'from-blue-500/10 to-indigo-500/10', iconColor: 'text-blue-600' },
    ];
  };

  const mealTypes = getMealTypes();

  // Load logs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLogs(JSON.parse(stored));
    }
    const fastingStored = localStorage.getItem(FASTING_KEY);
    if (fastingStored) {
      const parsedFasting = JSON.parse(fastingStored);
      setFastingLogs(parsedFasting);
      // Check if fasting today
      const todayFasting = parsedFasting.find((f: FastingLog) => f.date === new Date().toISOString().split('T')[0]);
      if (todayFasting) {
        setIsFastingToday(true);
        setSelectedFastingType(todayFasting.type);
      }
    }
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const getTodayLog = (mealType: MealLog['mealType']): MealLog | undefined => {
    return logs.find(l => l.date === today && l.mealType === mealType);
  };

  const getTodayFasting = (): FastingLog | undefined => {
    return fastingLogs.find(f => f.date === today);
  };

  const toggleFastingToday = (enabled: boolean) => {
    setIsFastingToday(enabled);
    if (!enabled) {
      // Remove fasting log for today
      const updated = fastingLogs.filter(f => f.date !== today);
      setFastingLogs(updated);
      localStorage.setItem(FASTING_KEY, JSON.stringify(updated));
      setSelectedFastingType(null);
    }
  };

  const saveFastingType = (type: FastingLog['type']) => {
    setSelectedFastingType(type);
    const newLog: FastingLog = {
      date: today,
      type,
      isCompleted: false,
    };
    const updated = fastingLogs.filter(f => f.date !== today);
    updated.push(newLog);
    setFastingLogs(updated);
    localStorage.setItem(FASTING_KEY, JSON.stringify(updated));
  };

  const completeFasting = () => {
    const updated = fastingLogs.map(f => 
      f.date === today ? { ...f, isCompleted: true } : f
    );
    setFastingLogs(updated);
    localStorage.setItem(FASTING_KEY, JSON.stringify(updated));
  };

  const saveMeal = (isSkipped: boolean = false) => {
    if (!selectedMeal) return;

    const isHealthy = !isSkipped && (
      formData.vegetables.length > 0 || 
      formData.fruits.length > 0 || 
      formData.proteinSource.length > 0
    );

    const newLog: MealLog = {
      date: today,
      mealType: selectedMeal,
      waterGlasses: formData.waterGlasses,
      proteinSource: formData.proteinSource || undefined,
      carbSource: formData.carbSource || undefined,
      vegetables: formData.vegetables || undefined,
      fruits: formData.fruits || undefined,
      notes: formData.notes || undefined,
      isHealthy,
      isSkipped,
      timestamp: Date.now(),
    };

    const updatedLogs = logs.filter(l => !(l.date === today && l.mealType === selectedMeal));
    updatedLogs.push(newLog);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
    setSelectedMeal(null);
    setFormData(defaultFormData);
  };

  // Calculate stats
  const todayLogs = logs.filter(l => l.date === today && !l.isSkipped);
  const totalWater = todayLogs.reduce((sum, l) => sum + l.waterGlasses, 0);
  const healthyMeals = todayLogs.filter(l => l.isHealthy).length;
  const completedMeals = mealTypes.filter(m => getTodayLog(m.id)).length;

  return (
    <div className="space-y-4">
      {/* Puasa Sunnah Toggle (only in normal mode) */}
      {!isRamadhanMode && (
        <Card className={`transition-all duration-300 ${
          isFastingToday 
            ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-300 dark:border-purple-700' 
            : 'bg-muted/30'
        }`}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isFastingToday ? 'bg-purple-500 text-white' : 'bg-muted'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Puasa Sunnah</p>
                  <p className="text-[10px] text-muted-foreground">
                    {isFastingToday 
                      ? selectedFastingType 
                        ? sunnahFastingTypes.find(t => t.id === selectedFastingType)?.label
                        : 'Pilih jenis puasa'
                      : 'Aktifkan jika puasa hari ini'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={isFastingToday} 
                onCheckedChange={toggleFastingToday}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            {/* Fasting Type Selection */}
            {isFastingToday && !selectedFastingType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t"
              >
                <p className="text-xs text-muted-foreground mb-2">Pilih jenis puasa:</p>
                <div className="grid grid-cols-2 gap-2">
                  {sunnahFastingTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 flex-col items-start text-left"
                      onClick={() => saveFastingType(type.id)}
                    >
                      <span className="text-base mb-0.5">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                      <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Fasting Status */}
            {isFastingToday && selectedFastingType && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 pt-3 border-t flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sunnahFastingTypes.find(t => t.id === selectedFastingType)?.icon}</span>
                  <div>
                    <p className="text-xs font-medium">{sunnahFastingTypes.find(t => t.id === selectedFastingType)?.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {getTodayFasting()?.isCompleted ? '✓ Selesai' : 'Sedang berjalan...'}
                    </p>
                  </div>
                </div>
                {!getTodayFasting()?.isCompleted && (
                  <Button size="sm" variant="outline" onClick={completeFasting}>
                    <Check className="w-4 h-4 mr-1" />
                    Selesai
                  </Button>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200/50">
          <CardContent className="p-3 text-center">
            <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{totalWater}</p>
            <p className="text-[10px] text-muted-foreground">Gelas Air</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/50">
          <CardContent className="p-3 text-center">
            <Leaf className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{healthyMeals}</p>
            <p className="text-[10px] text-muted-foreground">Makan Sehat</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200/50">
          <CardContent className="p-3 text-center">
            <Utensils className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold">{completedMeals}/{mealTypes.length}</p>
            <p className="text-[10px] text-muted-foreground">Tercatat</p>
          </CardContent>
        </Card>
      </div>

      {/* Meal Cards */}
      <div className="space-y-2">
        {mealTypes.map((meal) => {
          const Icon = meal.icon;
          const log = getTodayLog(meal.id);
          const isCompleted = !!log && !log.isSkipped;
          const isSkipped = log?.isSkipped;

          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  isCompleted 
                    ? 'bg-primary/5 border-primary/30' 
                    : isSkipped 
                      ? 'bg-muted/50 border-muted' 
                      : 'hover:shadow-md hover:border-primary/20'
                }`}
                onClick={() => !log && setSelectedMeal(meal.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${meal.color}`}>
                      <Icon className={`w-6 h-6 ${meal.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm">{meal.label}</h3>
                        {isCompleted && (
                          <Badge className="bg-primary/20 text-primary text-[10px]">
                            <Check className="w-3 h-3 mr-0.5" />
                            Tercatat
                          </Badge>
                        )}
                        {isSkipped && (
                          <Badge variant="secondary" className="text-[10px]">
                            <X className="w-3 h-3 mr-0.5" />
                            Skip
                          </Badge>
                        )}
                      </div>
                      
                      {isCompleted && log && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-500" />
                            {log.waterGlasses}
                          </span>
                          {log.isHealthy && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Leaf className="w-3 h-3" />
                              Sehat
                            </span>
                          )}
                        </div>
                      )}
                      
                      {!log && (
                        <p className="text-xs text-muted-foreground">
                          Ketuk untuk mencatat
                        </p>
                      )}
                    </div>

                    {!log && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Meal Entry Sheet */}
      <Sheet open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {selectedMeal && (
                <>
                  {(() => {
                    const meal = mealTypes.find(m => m.id === selectedMeal);
                    const Icon = meal?.icon || Utensils;
                    return <Icon className={`w-5 h-5 ${meal?.iconColor}`} />;
                  })()}
                  Catat {mealTypes.find(m => m.id === selectedMeal)?.label}
                </>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="space-y-5 pb-4">
              {/* Water intake */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Air Putih (gelas)
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <Button
                      key={num}
                      variant={formData.waterGlasses === num ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setFormData(prev => ({ ...prev, waterGlasses: num }))}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Food inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">🍗 Protein</Label>
                  <Input
                    placeholder="Telur, ayam..."
                    value={formData.proteinSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, proteinSource: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">🍚 Karbohidrat</Label>
                  <Input
                    placeholder="Nasi, roti..."
                    value={formData.carbSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, carbSource: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-green-600" /> Sayuran
                  </Label>
                  <Input
                    placeholder="Bayam, wortel..."
                    value={formData.vegetables}
                    onChange={(e) => setFormData(prev => ({ ...prev, vegetables: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Apple className="w-3 h-3 text-orange-600" /> Buah
                  </Label>
                  <Input
                    placeholder="Pisang, apel..."
                    value={formData.fruits}
                    onChange={(e) => setFormData(prev => ({ ...prev, fruits: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">📝 Catatan (opsional)</Label>
                <Input
                  placeholder="Catatan tambahan..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={() => saveMeal(false)}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Simpan
            </Button>
            <Button 
              variant="outline"
              onClick={() => saveMeal(true)}
            >
              <X className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MealTrackingView;
