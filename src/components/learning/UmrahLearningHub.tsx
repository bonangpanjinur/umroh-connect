import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, HandHeart, Book, MapPin, ClipboardCheck, Compass, Calculator, GraduationCap, ChevronRight, CheckCircle2, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useManasikGuides } from '@/hooks/useManasikGuides';
import { usePrayers } from '@/hooks/usePrayers';
import { useManasikProgress } from '@/hooks/useManasikProgress';

interface UmrahLearningHubProps {
  onMenuClick?: (menuId: string) => void;
}

const UmrahLearningHub = ({ onMenuClick }: UmrahLearningHubProps) => {
  const [activeTab, setActiveTab] = useState('tatacara');
  const [doaSearch, setDoaSearch] = useState('');
  const { data: manasikGuides = [], isLoading: loadingManasik } = useManasikGuides('umroh');
  const { data: prayers = [], isLoading: loadingPrayers } = usePrayers();
  const { completedSteps, toggleStep } = useManasikProgress();

  const progress = manasikGuides.length > 0
    ? Math.round((completedSteps.filter(id => manasikGuides.some(g => g.id === id)).length / manasikGuides.length) * 100)
    : 0;

  // Filter prayers by search
  const filteredPrayers = prayers.filter(p =>
    !doaSearch || p.title?.toLowerCase().includes(doaSearch.toLowerCase()) || p.category?.name?.toLowerCase().includes(doaSearch.toLowerCase())
  );

  // Group prayers by category name
  const prayerCategories = filteredPrayers.reduce((acc, p) => {
    const cat = p.category?.name || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof prayers>);

  // Quran progress from localStorage
  const quranProgress = (() => {
    try {
      const saved = localStorage.getItem('quran_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const quickTools = [
    { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, color: 'text-blue-600' },
    { id: 'qibla', label: 'Kiblat', icon: Compass, color: 'text-primary' },
    { id: 'tabungan', label: 'Kalkulator', icon: Calculator, color: 'text-emerald-600' },
    { id: 'peta', label: 'Peta', icon: MapPin, color: 'text-accent' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 space-y-4"
    >
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Belajar Umroh</h1>
            <p className="text-xs text-muted-foreground">Panduan lengkap persiapan ibadah</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Progress Belajar</span>
              <Badge variant="secondary" className="text-xs">{progress}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {completedSteps.filter(id => manasikGuides.some(g => g.id === id)).length} dari {manasikGuides.length} langkah dipelajari
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="tatacara" className="text-xs gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Tata Cara
            </TabsTrigger>
            <TabsTrigger value="doa" className="text-xs gap-1">
              <HandHeart className="w-3.5 h-3.5" />
              Doa-doa
            </TabsTrigger>
            <TabsTrigger value="quran" className="text-xs gap-1">
              <Book className="w-3.5 h-3.5" />
              Al-Quran
            </TabsTrigger>
          </TabsList>

          {/* Tab: Tata Cara */}
          <TabsContent value="tatacara" className="space-y-3 mt-3">
            {loadingManasik ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : manasikGuides.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada panduan manasik</p>
                </CardContent>
              </Card>
            ) : (
              manasikGuides.map((guide, idx) => {
                const isDone = completedSteps.includes(guide.id);
                return (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${isDone ? 'bg-primary/5 border-primary/20' : 'hover:shadow-md'}`}
                      onClick={() => toggleStep(guide.id)}
                    >
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${isDone ? 'text-primary' : 'text-foreground'}`}>
                            {guide.title}
                          </h4>
                          {guide.title_arabic && (
                            <p className="text-xs text-muted-foreground font-arabic">{guide.title_arabic}</p>
                          )}
                          {guide.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{guide.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}

            {/* Link to Maps */}
            <Button
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => onMenuClick?.('peta')}
            >
              <MapPin className="w-4 h-4 text-primary" />
              Lihat Peta Lokasi Penting
            </Button>
          </TabsContent>

          {/* Tab: Doa-doa */}
          <TabsContent value="doa" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari doa..."
                value={doaSearch}
                onChange={e => setDoaSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {loadingPrayers ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : Object.keys(prayerCategories).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <HandHeart className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {doaSearch ? 'Doa tidak ditemukan' : 'Belum ada doa'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(prayerCategories).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</h4>
                  <div className="space-y-2">
                    {items.map(prayer => (
                      <Card key={prayer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-3 px-4">
                          <h5 className="text-sm font-medium text-foreground">{prayer.title}</h5>
                          {prayer.arabic_text && (
                            <p className="text-right text-base font-arabic text-foreground mt-2 leading-loose">{prayer.arabic_text}</p>
                          )}
                          {prayer.transliteration && (
                            <p className="text-xs text-muted-foreground italic mt-1">{prayer.transliteration}</p>
                          )}
                          {prayer.translation && (
                            <p className="text-xs text-muted-foreground mt-1">{prayer.translation}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tab: Al-Quran */}
          <TabsContent value="quran" className="space-y-3 mt-3">
            {/* Continue reading card */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800">
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {quranProgress ? 'Lanjut Membaca' : 'Mulai Membaca'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {quranProgress
                        ? `Surah ${quranProgress.surahName || quranProgress.surah}, Ayat ${quranProgress.ayah || 1}`
                        : 'Al-Fatihah, Ayat 1'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => onMenuClick?.('quran')}
                  >
                    Baca
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Khatam progress */}
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress Khatam</span>
                  <span className="text-xs text-muted-foreground">
                    {quranProgress?.surah || 1}/114 Surah
                  </span>
                </div>
                <Progress value={((quranProgress?.surah || 1) / 114) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => onMenuClick?.('quran')}
            >
              <Book className="w-4 h-4" />
              Buka Al-Quran Digital
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Persiapan Lainnya */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Persiapan Lainnya</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickTools.map(tool => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMenuClick?.(tool.id)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{tool.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default UmrahLearningHub;
