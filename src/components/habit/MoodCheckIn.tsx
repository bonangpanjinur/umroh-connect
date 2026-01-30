import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, Meh, Frown, Heart, Sparkles, Cloud, CloudRain, Sun,
  Zap, Coffee, Moon, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const MOOD_STORAGE_KEY = 'habit_mood_logs';

interface MoodLog {
  id: string;
  date: string;
  mood: string;
  moodLevel: number;
  energyLevel: number;
  gratitude: string[];
  notes: string;
  timestamp: number;
}

const moodOptions = [
  { id: 'excellent', label: 'Luar Biasa', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10', level: 5 },
  { id: 'happy', label: 'Senang', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-500/10', level: 4 },
  { id: 'neutral', label: 'Biasa', icon: Meh, color: 'text-blue-500', bg: 'bg-blue-500/10', level: 3 },
  { id: 'tired', label: 'Lelah', icon: Cloud, color: 'text-purple-500', bg: 'bg-purple-500/10', level: 2 },
  { id: 'sad', label: 'Sedih', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-500/10', level: 1 },
];

const energyOptions = [
  { id: 'high', label: 'Berenergi', icon: Zap, level: 3 },
  { id: 'medium', label: 'Cukup', icon: Coffee, level: 2 },
  { id: 'low', label: 'Rendah', icon: Moon, level: 1 },
];

const gratitudePrompts = [
  'Keluarga', 'Kesehatan', 'Rezeki', 'Teman', 'Pekerjaan', 
  'Alam', 'Ilmu', 'Kesempatan', 'Ketenangan', 'Ibadah'
];

interface MoodCheckInProps {
  onComplete?: () => void;
  compact?: boolean;
}

export const MoodCheckIn = ({ onComplete, compact = false }: MoodCheckInProps) => {
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [selectedGratitude, setSelectedGratitude] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadTodayMood();
  }, []);

  const loadTodayMood = () => {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (stored) {
      const logs: MoodLog[] = JSON.parse(stored);
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayLog = logs.find(l => l.date === today);
      if (todayLog) {
        setTodayMood(todayLog);
      }
    }
  };

  const saveMood = () => {
    if (!selectedMood || !selectedEnergy) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const moodOption = moodOptions.find(m => m.id === selectedMood);
    const energyOption = energyOptions.find(e => e.id === selectedEnergy);

    const newLog: MoodLog = {
      id: crypto.randomUUID(),
      date: today,
      mood: selectedMood,
      moodLevel: moodOption?.level || 3,
      energyLevel: energyOption?.level || 2,
      gratitude: selectedGratitude,
      notes,
      timestamp: Date.now(),
    };

    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    let logs: MoodLog[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing today entry if any
    logs = logs.filter(l => l.date !== today);
    logs.unshift(newLog);
    
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(logs));
    setTodayMood(newLog);
    onComplete?.();
  };

  const toggleGratitude = (item: string) => {
    setSelectedGratitude(prev => 
      prev.includes(item) 
        ? prev.filter(g => g !== item)
        : [...prev, item].slice(0, 5) // Max 5
    );
  };

  // Compact view - already checked in
  if (todayMood && compact) {
    const moodOption = moodOptions.find(m => m.id === todayMood.mood);
    const Icon = moodOption?.icon || Smile;
    
    return (
      <Card className={`${moodOption?.bg} border-0`}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${moodOption?.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${moodOption?.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Mood hari ini: {moodOption?.label}</p>
            <p className="text-xs text-muted-foreground">
              {todayMood.gratitude.length > 0 && `Syukuri: ${todayMood.gratitude.slice(0, 3).join(', ')}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <Check className="w-3 h-3 mr-1" />
            Tercatat
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Already checked in - full view
  if (todayMood) {
    const moodOption = moodOptions.find(m => m.id === todayMood.mood);
    const Icon = moodOption?.icon || Smile;
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div 
            className={`p-4 ${moodOption?.bg} cursor-pointer`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${moodOption?.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Mood Hari Ini</p>
                  <p className={`text-lg font-bold ${moodOption?.color}`}>{moodOption?.label}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 border-t">
                  {/* Energy Level */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Energi:</span>
                    <span className="font-medium">
                      {energyOptions.find(e => e.level === todayMood.energyLevel)?.label}
                    </span>
                  </div>

                  {/* Gratitude */}
                  {todayMood.gratitude.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Yang disyukuri:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {todayMood.gratitude.map(g => (
                          <Badge key={g} variant="secondary" className="text-xs">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {todayMood.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      "{todayMood.notes}"
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  // Check-in flow
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold">Bagaimana perasaanmu hari ini?</h3>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map((mood) => {
                  const Icon = mood.icon;
                  const isSelected = selectedMood === mood.id;
                  
                  return (
                    <motion.button
                      key={mood.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        isSelected 
                          ? `${mood.bg} border-current ${mood.color}` 
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => setSelectedMood(mood.id)}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? mood.color : 'text-muted-foreground'}`} />
                      <span className={`text-[10px] font-medium ${isSelected ? '' : 'text-muted-foreground'}`}>
                        {mood.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {selectedMood && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <p className="text-sm font-medium mb-2">Level energimu?</p>
                    <div className="flex gap-2">
                      {energyOptions.map((energy) => {
                        const Icon = energy.icon;
                        const isSelected = selectedEnergy === energy.id;
                        
                        return (
                          <Button
                            key={energy.id}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => setSelectedEnergy(energy.id)}
                          >
                            <Icon className="w-4 h-4" />
                            {energy.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedEnergy && (
                    <Button
                      className="w-full"
                      onClick={() => setStep(2)}
                    >
                      Lanjut
                    </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">Apa yang kamu syukuri hari ini?</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {gratitudePrompts.map((item) => {
                  const isSelected = selectedGratitude.includes(item);
                  
                  return (
                    <Badge
                      key={item}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        isSelected ? '' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleGratitude(item)}
                    >
                      {item}
                    </Badge>
                  );
                })}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Catatan (opsional)</p>
                <Textarea
                  placeholder="Bagaimana harimu? Apa yang ada di pikiranmu?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Kembali
                </Button>
                <Button
                  onClick={saveMood}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default MoodCheckIn;
