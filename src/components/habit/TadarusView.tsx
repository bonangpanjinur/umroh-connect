import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuranSurahs, useTodayQuranLogs, useAddQuranLog, useQuranStats, useDeleteQuranLog } from '@/hooks/useQuranTracking';
import { BookOpen, Plus, Trash2, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TadarusView = () => {
  const { user } = useAuthContext();
  const { data: surahs, isLoading: surahsLoading } = useQuranSurahs();
  const { data: todayLogs, isLoading: logsLoading } = useTodayQuranLogs(user?.id);
  const stats = useQuranStats(user?.id);
  const addLog = useAddQuranLog();
  const deleteLog = useDeleteQuranLog();

  const [selectedSurah, setSelectedSurah] = useState<string>('');
  const [startVerse, setStartVerse] = useState('1');
  const [endVerse, setEndVerse] = useState('');
  const [showForm, setShowForm] = useState(false);

  const selectedSurahData = surahs?.find(s => s.number.toString() === selectedSurah);
  const targetJuz = 30; // Target: Khatam 1x selama Ramadhan

  const handleSubmit = () => {
    if (!user || !selectedSurah || !endVerse) return;

    addLog.mutate({
      userId: user.id,
      surahNumber: parseInt(selectedSurah),
      startVerse: parseInt(startVerse),
      endVerse: parseInt(endVerse),
    }, {
      onSuccess: () => {
        setSelectedSurah('');
        setStartVerse('1');
        setEndVerse('');
        setShowForm(false);
      }
    });
  };

  const handleDelete = (logId: string) => {
    if (!user) return;
    deleteLog.mutate({ logId, userId: user.id });
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          Silakan login untuk tracking tadarus
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Total Ayat</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.totalVerses}</p>
            <p className="text-xs text-muted-foreground">~{stats.estimatedJuz} juz</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Hari Tadarus</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.daysRead}</p>
            <p className="text-xs text-muted-foreground">{stats.uniqueSurahs} surat</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Khatam */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress Khatam</span>
            <span className="text-sm text-muted-foreground">{stats.estimatedJuz}/{targetJuz} Juz</span>
          </div>
          <Progress value={(stats.estimatedJuz / targetJuz) * 100} className="h-2" />
          {stats.estimatedJuz >= targetJuz && (
            <div className="flex items-center gap-1 mt-2 text-emerald-600">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Alhamdulillah, Khatam!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Reading */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Bacaan Hari Ini</CardTitle>
            <Button 
              size="sm" 
              variant={showForm ? "secondary" : "default"}
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="space-y-2">
                  <Label>Surat</Label>
                  <Select value={selectedSurah} onValueChange={(val) => {
                    setSelectedSurah(val);
                    const surah = surahs?.find(s => s.number.toString() === val);
                    if (surah) {
                      setEndVerse(surah.total_verses.toString());
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih surat..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {surahs?.map(surah => (
                        <SelectItem key={surah.number} value={surah.number.toString()}>
                          {surah.number}. {surah.name} ({surah.name_arabic})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSurahData && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dari Ayat</Label>
                      <Input
                        type="number"
                        min={1}
                        max={selectedSurahData.total_verses}
                        value={startVerse}
                        onChange={(e) => setStartVerse(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sampai Ayat</Label>
                      <Input
                        type="number"
                        min={parseInt(startVerse) || 1}
                        max={selectedSurahData.total_verses}
                        value={endVerse}
                        onChange={(e) => setEndVerse(e.target.value)}
                        placeholder={`max ${selectedSurahData.total_verses}`}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedSurah || !endVerse || addLog.isPending}
                  className="w-full"
                >
                  {addLog.isPending ? 'Menyimpan...' : 'Simpan Bacaan'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Today's logs */}
          {logsLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : todayLogs && todayLogs.length > 0 ? (
            <div className="space-y-2">
              {todayLogs.map(log => {
                const surah = surahs?.find(s => s.number === log.surah_number);
                return (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {surah?.name} ({surah?.name_arabic})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ayat {log.start_verse} - {log.end_verse}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {log.end_verse - log.start_verse + 1} ayat
                        </Badge>
                      </p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada bacaan hari ini</p>
              <p className="text-xs">Yuk mulai tadarus!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TadarusView;
