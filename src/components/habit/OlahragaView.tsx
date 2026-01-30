import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Activity, Footprints, Dumbbell, Bike, Waves, Moon, Sunset,
  Plus, TrendingUp, Trash2, Clock, Flame, AlertTriangle
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  useExerciseTypes, 
  useExerciseLogs, 
  useExerciseStats, 
  useWeeklyExercise,
  useAddExercise,
  useDeleteExercise,
  getRecommendedExercise
} from '@/hooks/useOlahraga';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const iconMap: Record<string, any> = {
  footprints: Footprints,
  move: Activity,
  dumbbell: Dumbbell,
  activity: Activity,
  moon: Moon,
  sunset: Sunset,
  bike: Bike,
  waves: Waves,
};

const intensityColors: Record<string, string> = {
  ringan: 'bg-green-500/10 text-green-600 border-green-500/20',
  sedang: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  berat: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const timeLabels: Record<string, string> = {
  sebelum_berbuka: '🌅 Sebelum Berbuka',
  setelah_tarawih: '🌙 Setelah Tarawih',
  setelah_sahur: '☀️ Setelah Sahur',
  kapan_saja: '⏰ Kapan Saja',
};

export const OlahragaView = () => {
  const { user } = useAuthContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState(15);
  const [intensity, setIntensity] = useState('ringan');
  const [timeOfDay, setTimeOfDay] = useState('setelah_tarawih');
  
  const { data: types = [] } = useExerciseTypes();
  const { data: logs = [] } = useExerciseLogs(user?.id);
  const { data: stats } = useExerciseStats(user?.id);
  const { data: weeklyData = [] } = useWeeklyExercise(user?.id);
  const addExercise = useAddExercise();
  const deleteExercise = useDeleteExercise();

  const currentHour = new Date().getHours();
  const recommendation = getRecommendedExercise(currentHour);

  const handleAdd = async () => {
    if (!user || !selectedType) return;
    
    try {
      await addExercise.mutateAsync({
        userId: user.id,
        exerciseTypeId: selectedType,
        durationMinutes: duration,
        intensity,
        timeOfDay,
      });
      
      toast.success('Olahraga tercatat! Sehat terus 💪');
      setShowAddModal(false);
      setSelectedType(null);
      setDuration(15);
    } catch (error) {
      toast.error('Gagal mencatat olahraga');
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await deleteExercise.mutateAsync(logId);
      toast.success('Catatan dihapus');
    } catch (error) {
      toast.error('Gagal menghapus');
    }
  };

  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

  if (!user) {
    return (
      <div className="p-4 text-center">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Masuk untuk Tracking Olahraga</h3>
            <p className="text-muted-foreground text-sm">
              Login untuk mulai mencatat olahraga harian Anda
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4">
      {/* Header Stats */}
      <div className="px-4 pt-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-4 text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Habit Olahraga</span>
              {stats?.hasExerciseToday && (
                <Badge className="bg-white/20 text-white text-xs">
                  ✓ Sudah Olahraga
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {format(new Date(), 'EEEE, d MMMM', { locale: id })}
            </h2>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs opacity-80">Total Menit</p>
                <p className="text-xl font-bold">{stats?.totalMinutes || 0}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Sesi Olahraga</p>
                <p className="text-xl font-bold">{stats?.totalSessions || 0}x</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Hari Aktif</p>
                <p className="text-xl font-bold">{stats?.uniqueDays || 0} hari</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recommendation Banner */}
      <div className="px-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <Flame className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Rekomendasi Saat Ini</p>
                <p className="text-xs text-muted-foreground">{recommendation.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Banner */}
      <div className="px-4">
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Jangan overwork saat puasa. Fokus konsistensi, bukan intensitas!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Aktivitas 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-20 gap-1">
              {weeklyData.map((day, i) => (
                <motion.div
                  key={day.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(20, (day.minutes / maxWeeklyMinutes) * 100)}%` }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex-1 rounded-t-md ${
                    day.isToday 
                      ? 'bg-blue-500' 
                      : day.count > 0 ? 'bg-blue-300' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {weeklyData.map((day) => (
                <span 
                  key={day.date} 
                  className={`text-xs flex-1 text-center ${
                    day.isToday ? 'text-blue-600 font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {day.dayName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="px-4">
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Catat Olahraga
        </Button>
      </div>

      {/* Exercise Types Grid */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Jenis Olahraga Ramadan</h3>
        <div className="grid grid-cols-2 gap-3">
          {types.map((type) => {
            const Icon = iconMap[type.icon] || Activity;
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => {
                    setSelectedType(type.id);
                    setDuration(type.duration_minutes);
                    setIntensity(type.intensity);
                    setShowAddModal(true);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${intensityColors[type.intensity]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{type.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{type.duration_minutes} menit</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`mt-2 text-[10px] ${intensityColors[type.intensity]}`}>
                      {type.intensity}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Catatan Olahraga Terbaru</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {logs.slice(0, 5).map((log, index) => {
              const Icon = iconMap[log.exercise_type?.icon || 'activity'] || Activity;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${intensityColors[log.intensity || 'ringan']}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {log.exercise_type?.name || 'Olahraga'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'd MMM yyyy', { locale: id })} • {log.duration_minutes} menit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={intensityColors[log.intensity || 'ringan']}>
                          {log.intensity}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {logs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada catatan olahraga</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Olahraga</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Olahraga</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {types.map((type) => {
                  const Icon = iconMap[type.icon] || Activity;
                  const isSelected = selectedType === type.id;
                  return (
                    <Button
                      key={type.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`justify-start h-auto py-2 ${isSelected ? 'bg-blue-500' : ''}`}
                      onClick={() => {
                        setSelectedType(type.id);
                        setDuration(type.duration_minutes);
                        setIntensity(type.intensity);
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span className="text-sm truncate">{type.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Durasi: {duration} menit</label>
              <Slider
                value={[duration]}
                onValueChange={(v) => setDuration(v[0])}
                min={5}
                max={60}
                step={5}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Intensitas</label>
              <div className="flex gap-2">
                {['ringan', 'sedang', 'berat'].map((i) => (
                  <Button
                    key={i}
                    variant={intensity === i ? "default" : "outline"}
                    size="sm"
                    className={intensity === i ? 'bg-blue-500' : ''}
                    onClick={() => setIntensity(i)}
                  >
                    {i.charAt(0).toUpperCase() + i.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Waktu</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(timeLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={timeOfDay === key ? "default" : "outline"}
                    size="sm"
                    className={`text-xs ${timeOfDay === key ? 'bg-blue-500' : ''}`}
                    onClick={() => setTimeOfDay(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={handleAdd}
              disabled={!selectedType || addExercise.isPending}
            >
              {addExercise.isPending ? 'Menyimpan...' : 'Simpan Olahraga'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OlahragaView;
