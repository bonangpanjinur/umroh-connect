import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, Meh, Frown, Heart, Sparkles, Cloud, CloudRain, Sun,
  Zap, Coffee, Moon, Check, ChevronDown, ChevronUp, RefreshCw,
  Lightbulb, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useMoodTracking, moodConfig, MoodType, MoodLog } from '@/hooks/useMoodTracking';

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
  onComplete?: (mood: MoodLog) => void;
  onMoodChange?: (mood: string, moodLevel: number, energyLevel: number) => void;
  compact?: boolean;
}

export const MoodCheckIn = ({ onComplete, onMoodChange, compact = false }: MoodCheckInProps) => {
  const { todayMood, saveMood, getMoodConfig } = useMoodTracking();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [selectedGratitude, setSelectedGratitude] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  // Notify parent when mood changes during selection
  useEffect(() => {
    if (selectedMood && selectedEnergy && onMoodChange) {
      const moodOption = moodOptions.find(m => m.id === selectedMood);
      const energyOption = energyOptions.find(e => e.id === selectedEnergy);
      onMoodChange(selectedMood, moodOption?.level || 3, energyOption?.level || 2);
    }
  }, [selectedMood, selectedEnergy, onMoodChange]);

  const handleSaveMood = () => {
    if (!selectedMood || !selectedEnergy) return;

    const moodOption = moodOptions.find(m => m.id === selectedMood);
    const energyOption = energyOptions.find(e => e.id === selectedEnergy);

    const savedMood = saveMood({
      mood: selectedMood,
      moodLevel: moodOption?.level || 3,
      energyLevel: energyOption?.level || 2,
      gratitude: selectedGratitude,
      notes,
    });

    setIsEditing(false);
    onComplete?.(savedMood);
  };

  const toggleGratitude = (item: string) => {
    setSelectedGratitude(prev => 
      prev.includes(item) 
        ? prev.filter(g => g !== item)
        : [...prev, item].slice(0, 5)
    );
  };

  const startEditing = () => {
    if (todayMood) {
      setSelectedMood(todayMood.mood);
      setSelectedEnergy(energyOptions.find(e => e.level === todayMood.energyLevel)?.id || 'medium');
      setSelectedGratitude(todayMood.gratitude);
      setNotes(todayMood.notes);
    }
    setStep(1);
    setIsEditing(true);
  };

  // Compact view - already checked in
  if (todayMood && compact && !isEditing) {
    const moodOption = moodOptions.find(m => m.id === todayMood.mood);
    const config = getMoodConfig(todayMood.mood);
    const Icon = moodOption?.icon || Smile;
    
    return (
      <Card className={`${moodOption?.bg} border-0 overflow-hidden`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${moodOption?.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${moodOption?.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Mood: {moodOption?.label}</p>
              <p className="text-xs text-muted-foreground truncate">
                {config.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={startEditing}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already checked in - full view with tips
  if (todayMood && !isEditing) {
    const moodOption = moodOptions.find(m => m.id === todayMood.mood);
    const config = getMoodConfig(todayMood.mood);
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
                <motion.div 
                  className={`w-14 h-14 rounded-2xl bg-white/60 dark:bg-black/20 flex items-center justify-center`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon className={`w-7 h-7 ${moodOption?.color}`} />
                </motion.div>
                <div>
                  <p className="font-semibold">Mood Hari Ini</p>
                  <p className={`text-xl font-bold ${moodOption?.color}`}>{moodOption?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing();
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Mood Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 p-3 rounded-xl bg-white/50 dark:bg-black/20"
            >
              <p className="text-sm font-medium">{config.message}</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 border-t">
                  {/* Tips Based on Mood */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-medium">Tips untuk hari ini</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {config.tips.map((tip, i) => (
                        <motion.div
                          key={tip}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-xs"
                        >
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>{tip}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Energy Level */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level Energi:</span>
                    <Badge variant="secondary">
                      {energyOptions.find(e => e.level === todayMood.energyLevel)?.label}
                    </Badge>
                  </div>

                  {/* Gratitude */}
                  {todayMood.gratitude.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Yang disyukuri:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {todayMood.gratitude.map(g => (
                          <Badge key={g} variant="outline" className="text-xs bg-primary/5">
                            ✨ {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {todayMood.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm italic">
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
    <Card className="overflow-hidden border-2 border-primary/20">
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

              {/* Dynamic mood message preview */}
              {selectedMood && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className={`p-3 rounded-xl ${moodConfig[selectedMood as MoodType]?.bg}`}>
                    <p className={`text-sm font-medium ${moodConfig[selectedMood as MoodType]?.color}`}>
                      {moodConfig[selectedMood as MoodType]?.message}
                    </p>
                  </div>

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
                      <ArrowRight className="w-4 h-4 ml-2" />
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
                      {isSelected && '✓ '}{item}
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
                  onClick={handleSaveMood}
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
