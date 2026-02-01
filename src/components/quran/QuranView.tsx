import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, Search, ChevronRight, ChevronLeft, 
  Star, Bookmark, Play, Headphones, CheckCircle2
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
import { useAddQuranLog } from '@/hooks/useQuranTracking';
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

  const handleFinishReading = () => {
    if (!user || !selectedSurah || !surahArabic) return;

    addLog.mutate({
      userId: user.id,
      surahStart: selectedSurah,
      ayahStart: startAyah,
      surahEnd: selectedSurah,
      ayahEnd: currentAyah,
      totalVerses: currentAyah - startAyah + 1,
      juzStart: surahArabic.ayahs[startAyah - 1]?.juz,
      juzEnd: surahArabic.ayahs[currentAyah - 1]?.juz,
    });
    
    // Reset start ayah for next session
    setStartAyah(currentAyah + 1 > surahArabic.numberOfAyahs ? 1 : currentAyah + 1);
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
                onClick={handleFinishReading}
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
                    onClick={() => setCurrentAyah(ayah.numberInSurah)}
                  >
                    {/* Ayah Actions */}
                    <div className="flex justify-between items-center mb-3">
                      <Badge 
                        variant={currentAyah === ayah.numberInSurah ? "primary" : "secondary"} 
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
                          className="h-8 w-8 rounded-full text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Bookmark className="w-4 h-4" />
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
