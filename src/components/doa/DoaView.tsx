import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Search,
  BookOpen, Sparkles, Plane, Sun, ChevronRight, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrayerCategories, usePrayers, Prayer, PrayerCategory } from '@/hooks/usePrayers';
import { useToast } from '@/hooks/use-toast';

interface DoaViewProps {
  onBack: () => void;
}

const getCategoryIcon = (icon: string | null) => {
  switch (icon) {
    case 'kaaba':
      return <span className="text-lg">🕋</span>;
    case 'sun':
      return <Sun className="w-5 h-5" />;
    case 'plane':
      return <Plane className="w-5 h-5" />;
    case 'sparkles':
      return <Sparkles className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
};

const DoaView = ({ onBack }: DoaViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: categories, isLoading: loadingCategories } = usePrayerCategories();
  const { data: prayers, isLoading: loadingPrayers } = usePrayers(selectedCategory || undefined);

  // Filter prayers by search
  const filteredPrayers = prayers?.filter(prayer => 
    prayer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prayer.arabic_text.includes(searchQuery) ||
    prayer.translation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedPrayer) {
    return (
      <PrayerDetail
        prayer={selectedPrayer}
        onBack={() => setSelectedPrayer(null)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Doa Harian</h1>
            <p className="text-sm text-muted-foreground">Koleksi doa-doa umroh</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari doa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {categories && categories.length > 0 && (
          <div className="px-4 pb-3 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(null)}
              >
                Semua
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {getCategoryIcon(category.icon)}
                  <span className="ml-1">{category.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-20 space-y-3">
        {loadingPrayers ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : filteredPrayers && filteredPrayers.length > 0 ? (
          <AnimatePresence>
            {filteredPrayers.map((prayer, index) => (
              <motion.div
                key={prayer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPrayer(prayer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {prayer.category && (
                            <Badge variant="secondary" className="text-xs">
                              {prayer.category.name}
                            </Badge>
                          )}
                          {prayer.audio_url && (
                            <Badge variant="outline" className="text-xs">
                              <Volume2 className="w-3 h-3 mr-1" />
                              Audio
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">{prayer.title}</h3>
                        {prayer.title_arabic && (
                          <p className="text-sm text-primary font-arabic mt-1">
                            {prayer.title_arabic}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-arabic text-right" dir="rtl">
                          {prayer.arabic_text}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Tidak ada doa ditemukan' : 'Belum ada doa tersedia'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Prayer Detail Component
interface PrayerDetailProps {
  prayer: Prayer;
  onBack: () => void;
}

const PrayerDetail = ({ prayer, onBack }: PrayerDetailProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (prayer.audio_url) {
      audioRef.current = new Audio(prayer.audio_url);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [prayer.audio_url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const copyToClipboard = async () => {
    const text = `${prayer.title}\n\n${prayer.arabic_text}\n\n${prayer.transliteration || ''}\n\nArtinya: ${prayer.translation || ''}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Doa disalin ke clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{prayer.title}</h1>
              {prayer.category && (
                <p className="text-sm text-muted-foreground">{prayer.category.name}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={copyToClipboard}>
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Arabic Text */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <p className="text-2xl font-arabic text-foreground leading-loose text-right" dir="rtl">
              {prayer.arabic_text}
            </p>
          </CardContent>
        </Card>

        {/* Audio Player */}
        {prayer.audio_url && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Audio Doa</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transliteration */}
        {prayer.transliteration && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Transliterasi</h3>
              <p className="text-foreground italic leading-relaxed">
                {prayer.transliteration}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Translation */}
        {prayer.translation && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Arti</h3>
              <p className="text-foreground leading-relaxed">
                {prayer.translation}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Source */}
        {prayer.source && (
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Sumber: {prayer.source}
            </Badge>
          </div>
        )}

        {/* Benefits */}
        {prayer.benefits && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-accent-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Keutamaan
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prayer.benefits}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default DoaView;
