import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, Banknote, Utensils, HandHeart, Package, Smile, 
  BookOpen, Plus, TrendingUp, Sun, Trash2, X, Check
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  useSedekahTypes, 
  useSedekahLogs, 
  useSedekahStats, 
  useWeeklySedekah,
  useAddSedekah,
  useDeleteSedekah 
} from '@/hooks/useSedekah';
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
  banknote: Banknote,
  utensils: Utensils,
  'hand-helping': HandHeart,
  package: Package,
  smile: Smile,
  'book-open': BookOpen,
  heart: Heart,
};

const categoryColors: Record<string, string> = {
  uang: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  makanan: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  tenaga: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  barang: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  kebaikan: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

export const SedekahView = () => {
  const { user } = useAuthContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubuhMode, setIsSubuhMode] = useState(false);
  
  const { data: types = [] } = useSedekahTypes();
  const { data: logs = [] } = useSedekahLogs(user?.id);
  const { data: stats } = useSedekahStats(user?.id);
  const { data: weeklyData = [] } = useWeeklySedekah(user?.id);
  const addSedekah = useAddSedekah();
  const deleteSedekah = useDeleteSedekah();

  const handleAdd = async () => {
    if (!user || !selectedType) return;
    
    try {
      await addSedekah.mutateAsync({
        userId: user.id,
        sedekahTypeId: selectedType,
        amount: parseFloat(amount) || 0,
        description: description || undefined,
        isSubuhMode,
      });
      
      toast.success('Sedekah tercatat! Semoga berkah 🤲');
      setShowAddModal(false);
      setSelectedType(null);
      setAmount('');
      setDescription('');
      setIsSubuhMode(false);
    } catch (error) {
      toast.error('Gagal mencatat sedekah');
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await deleteSedekah.mutateAsync(logId);
      toast.success('Catatan sedekah dihapus');
    } catch (error) {
      toast.error('Gagal menghapus');
    }
  };

  const maxWeeklyAmount = Math.max(...weeklyData.map(d => d.amount), 1);

  if (!user) {
    return (
      <div className="p-4 text-center">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Masuk untuk Tracking Sedekah</h3>
            <p className="text-muted-foreground text-sm">
              Login untuk mulai mencatat sedekah harian Anda
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
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Habit Sedekah</span>
              {stats?.hasSedekahToday && (
                <Badge className="bg-white/20 text-white text-xs">
                  ✓ Sudah Sedekah
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {format(new Date(), 'EEEE, d MMMM', { locale: id })}
            </h2>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs opacity-80">Total Bulan Ini</p>
                <p className="text-xl font-bold">
                  Rp {(stats?.totalAmount || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-80">Jumlah Sedekah</p>
                <p className="text-xl font-bold">{stats?.totalCount || 0}x</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Hari Bersedekah</p>
                <p className="text-xl font-bold">{stats?.uniqueDays || 0} hari</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subuh Mode Banner */}
      <div className="px-4">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Mode Sedekah Subuh</p>
                <p className="text-xs text-muted-foreground">Sedekah di waktu subuh, berkah berlipat</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant={isSubuhMode ? "default" : "outline"}
              onClick={() => setIsSubuhMode(!isSubuhMode)}
              className={isSubuhMode ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              {isSubuhMode ? <Check className="w-4 h-4" /> : "Aktifkan"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Sedekah 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-20 gap-1">
              {weeklyData.map((day, i) => (
                <motion.div
                  key={day.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(20, (day.amount / maxWeeklyAmount) * 100)}%` }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex-1 rounded-t-md ${
                    day.isToday 
                      ? 'bg-emerald-500' 
                      : day.count > 0 ? 'bg-emerald-300' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {weeklyData.map((day) => (
                <span 
                  key={day.date} 
                  className={`text-xs flex-1 text-center ${
                    day.isToday ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {day.dayName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Sedekah Button */}
      <div className="px-4">
        <Button 
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Catat Sedekah
        </Button>
      </div>

      {/* Sedekah Types Grid */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Jenis Sedekah</h3>
        <div className="grid grid-cols-2 gap-3">
          {types.map((type) => {
            const Icon = iconMap[type.icon] || Heart;
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer hover:border-emerald-300 transition-colors"
                  onClick={() => {
                    setSelectedType(type.id);
                    setShowAddModal(true);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${categoryColors[type.category]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{type.name}</p>
                        {type.name_arabic && (
                          <p className="text-xs text-muted-foreground font-arabic">{type.name_arabic}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Catatan Sedekah Terbaru</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {logs.slice(0, 5).map((log, index) => {
              const Icon = iconMap[log.sedekah_type?.icon || 'heart'] || Heart;
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${categoryColors[log.sedekah_type?.category || 'kebaikan']}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {log.sedekah_type?.name || 'Sedekah'}
                            {log.is_subuh_mode && <Sun className="w-3 h-3 inline ml-1 text-amber-500" />}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.amount > 0 && (
                          <Badge variant="secondary">
                            Rp {log.amount.toLocaleString('id-ID')}
                          </Badge>
                        )}
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
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada catatan sedekah</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Modal - Improved UX */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <DialogTitle>Catat Sedekah</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Sedekah</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => {
                  const Icon = iconMap[type.icon] || Heart;
                  const isSelected = selectedType === type.id;
                  return (
                    <Button
                      key={type.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`justify-start h-auto py-2.5 ${isSelected ? 'bg-emerald-500' : ''}`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">{type.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Nominal (opsional)</label>
              <Input
                type="number"
                placeholder="Rp 0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Catatan (opsional)</label>
              <Textarea
                placeholder="Ceritakan sedekahmu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="subuhMode"
                checked={isSubuhMode}
                onChange={(e) => setIsSubuhMode(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="subuhMode" className="text-sm flex items-center gap-1">
                <Sun className="w-4 h-4 text-amber-500" />
                Sedekah Subuh
              </label>
            </div>
          </div>
          
          {/* Sticky Footer */}
          <div className="p-4 border-t bg-background sticky bottom-0">
            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              onClick={handleAdd}
              disabled={!selectedType || addSedekah.isPending}
            >
              {addSedekah.isPending ? 'Menyimpan...' : 'Simpan Sedekah'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SedekahView;
