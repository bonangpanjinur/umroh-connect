import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, Search, ChevronRight, ChevronLeft, 
  Star, Bookmark, Play, Headphones, CheckCircle2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useSurahList, 
  useSurahArabic, 
  useSurahTranslation,
  POPULAR_SURAHS,
  Surah
} from '@/hooks/useQuranAPI';
import { useAddQuranLog, useQuranLastRead } from '@/hooks/useQuranTracking';
import { useAuthContext } from '@/contexts/AuthContext';
import QuranAudioPlayer from './QuranAudioPlayer';

interface QuranViewProps {
  onBack?: () => void;
}

const QuranView = ({ onBack }: QuranViewProps) => {
  const { user } = useAuthContext();
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslation, setShowTranslation] = useState(true);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  
  const { data: surahList, isLoading: listLoading } = useSurahList();
  const { data: surahArabic, isLoading: arabicLoading } = useSurahArabic(selectedSurah);
  const { data: surahTranslation, isLoading: translationLoading } = useSurahTranslation(selectedSurah);
  const { data: lastRead } = useQuranLastRead(user?.id);
  const addLog = useAddQuranLog();
  const ayahRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  const filteredSurahs = surahList?.filter(surah => 
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name.includes(searchQuery) ||
    surah.number.toString() === searchQuery
  );

  const isLoading = arabicLoading || translationLoading;

  useEffect(() => {
    if (showAudioPlayer && currentAyah && ayahRefs.current[currentAyah]) {
      ayahRefs.current[currentAyah]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentAyah, showAudioPlayer]);

  const handleFinishReading = (ayahOverride?: any) => {
    if (!user || !selectedSurah || !surahArabic) return;

    // Ensure targetAyah is a number and not an event object
    const targetAyah = typeof ayahOverride === 'number' ? ayahOverride : currentAyah;

    // Type guard for lastRead
    const typedLastRead = lastRead as { surah_number?: number; ayah_number?: number } | null;

    // If this ayah is already the last read, don't re-save to avoid duplicates
    if (typedLastRead?.surah_number === selectedSurah && typedLastRead?.ayah_number === targetAyah) {
      return;
    }

    // Determine the actual start point
    // If we're in the same surah as last read, start from the next ayah
    const effectiveStartAyah = (typedLastRead?.surah_number === selectedSurah) 
      ? Math.min(targetAyah, (typedLastRead?.ayah_number || 0) + 1)
      : 1;

    // Correctly get juz numbers
    // Note: ayahs array index is 0-based, while ayah numberInSurah is 1-based
    const startAyahIndex = Math.max(0, effectiveStartAyah - 1);
    const targetAyahIndex = Math.max(0, targetAyah - 1);
    
    const juzStart = surahArabic.ayahs[startAyahIndex]?.juz || 1;
    const juzEnd = surahArabic.ayahs[targetAyahIndex]?.juz || juzStart;

    addLog.mutate({
      userId: user.id,
      surahStart: selectedSurah,
      ayahStart: effectiveStartAyah,
      surahEnd: selectedSurah,
      ayahEnd: targetAyah,
      totalVerses: Math.max(1, targetAyah - effectiveStartAyah + 1),
      juzStart: juzStart,
      juzEnd: juzEnd,
    });
    
    // Update start ayah for next potential session in same view
    setStartAyah(targetAyah + 1 > surahArabic.numberOfAyahs ? 1 : targetAyah + 1);
    if (typeof ayahOverride === 'number') setCurrentAyah(targetAyah);
  };

  // Surah List View
  if (!selectedSurah) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="font-bold text-lg flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Al-Qur'an
              </h1>
              <p className="text-xs text-muted-foreground">114 Surah</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari surah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </header>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-4">
            {/* Last Read Card */}
            {lastRead && 'surah_number' in lastRead && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 rounded-2xl p-4 border border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Bookmark className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Terakhir Baca</p>
                    <p className="text-sm font-bold">
                      {surahList?.find(s => s.number === (lastRead as any).surah_number)?.englishName || `Surah ${(lastRead as any).surah_number}`}, Ayat {(lastRead as any).ayah_number}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-full bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setSelectedSurah((lastRead as any).surah_number);
                    setCurrentAyah((lastRead as any).ayah_number);
                  }}
                >
                  Lanjut
                </Button>
              </motion.div>
            )}

            {/* Popular Surahs */}
            {!searchQuery && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Surat Populer
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {POPULAR_SURAHS.map((surah) => (
                    <Button
                      key={surah.number}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSurah(surah.number)}
                      className="text-xs"
                    >
                      {surah.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Surah List */}
            <div>
              <h3 className="text-sm font-medium mb-3">Daftar Surah</h3>
              
              {listLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSurahs?.map((surah) => (
                    <SurahCard 
                      key={surah.number} 
                      surah={surah}
                      onClick={() => setSelectedSurah(surah.number)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Surah Detail View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSelectedSurah(null)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{surahArabic?.englishName || 'Loading...'}</h1>
            <p className="text-xs text-muted-foreground">
              {surahArabic?.name} • {surahArabic?.numberOfAyahs} Ayat • {surahArabic?.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFinishReading()}
                className="h-8 w-8 text-emerald-600"
                title="Selesai Baca"
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAudioPlayer(!showAudioPlayer)}
              className="h-8 w-8"
              title="Audio Reciter"
            >
              <Headphones className={`w-4 h-4 ${showAudioPlayer ? 'text-primary' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranslation(!showTranslation)}
              className="text-xs"
            >
              {showTranslation ? 'Sembunyikan' : 'Terjemahan'}
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4">
          {/* Bismillah */}
          {selectedSurah !== 1 && selectedSurah !== 9 && (
            <div className="text-center py-6 mb-4">
              <p className="text-2xl font-arabic text-foreground">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Dengan nama Allah Yang Maha Pengasih, Maha Penyayang
              </p>
            </div>
          )}

          {/* Ayahs */}
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {surahArabic?.ayahs.map((ayah, index) => {
                const translation = surahTranslation?.ayahs[index];
                
                return (
                  <motion.div
                    key={ayah.number}
                    ref={el => ayahRefs.current[ayah.numberInSurah] = el}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`pb-4 border-b border-border last:border-0 transition-colors duration-300 ${
                      currentAyah === ayah.numberInSurah ? 'bg-primary/5 -mx-4 px-4' : ''
                    }`}
                    onClick={() => {
                      setCurrentAyah(ayah.numberInSurah);
                    }}
                  >
                    {/* Ayah Actions */}
                    <div className="flex justify-between items-center mb-3">
                      <Badge 
                        variant={currentAyah === ayah.numberInSurah ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {ayah.numberInSurah}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full ${currentAyah === ayah.numberInSurah && showAudioPlayer ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentAyah(ayah.numberInSurah);
                            setShowAudioPlayer(true);
                          }}
                        >
                          <Play className={`w-4 h-4 ${currentAyah === ayah.numberInSurah && showAudioPlayer ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full ${(lastRead as any)?.surah_number === selectedSurah && (lastRead as any)?.ayah_number === ayah.numberInSurah ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFinishReading(ayah.numberInSurah);
                          }}
                          title="Tandai Terakhir Baca & Simpan Tadarus"
                        >
                          {(lastRead as any)?.surah_number === selectedSurah && (lastRead as any)?.ayah_number === ayah.numberInSurah ? (
                            <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <p 
                      className="text-2xl leading-loose text-right font-arabic mb-3"
                      dir="rtl"
                    >
                      {ayah.text}
                    </p>

                    {/* Translation */}
                    <AnimatePresence>
                      {showTranslation && translation && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-muted-foreground leading-relaxed"
                        >
                          {translation.text}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Audio Player */}
      <AnimatePresence>
        {showAudioPlayer && surahArabic && (
          <QuranAudioPlayer
            surahNumber={selectedSurah!}
            surahName={surahArabic.englishName}
            ayahs={surahArabic.ayahs.map(a => ({
              number: a.number,
              numberInSurah: a.numberInSurah,
              audio: '',
              text: a.text,
            }))}
            currentAyah={currentAyah}
            onAyahChange={setCurrentAyah}
            onClose={() => setShowAudioPlayer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Surah Card Component
const SurahCard = ({ surah, onClick }: { surah: Surah; onClick: () => void }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-all text-left"
    >
      {/* Number */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
        {surah.number}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{surah.englishName}</p>
          <Badge variant="secondary" className="text-[10px]">
            {surah.numberOfAyahs} ayat
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {surah.englishNameTranslation}
        </p>
      </div>

      {/* Arabic Name */}
      <p className="text-lg font-arabic text-primary">{surah.name}</p>

      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.button>
  );
};

export default QuranView;
