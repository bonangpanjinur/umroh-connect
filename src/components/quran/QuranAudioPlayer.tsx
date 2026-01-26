import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  ChevronDown, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Popular Quran reciters
export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', language: 'Arabic' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', language: 'Arabic' },
  { id: 'ar.abdulsamad', name: 'Abdul Samad', language: 'Arabic' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', language: 'Arabic' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi', language: 'Arabic' },
  { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', language: 'Arabic' },
];

interface AudioAyah {
  number: number;
  numberInSurah: number;
  audio: string;
  text: string;
}

interface QuranAudioPlayerProps {
  surahNumber: number;
  surahName: string;
  ayahs: AudioAyah[];
  currentAyah: number;
  onAyahChange: (ayahNumber: number) => void;
  onClose: () => void;
}

const QuranAudioPlayer = ({
  surahNumber,
  surahName,
  ayahs,
  currentAyah,
  onAyahChange,
  onClose,
}: QuranAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [reciter, setReciter] = useState('ar.alafasy');
  const [audioData, setAudioData] = useState<AudioAyah[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch audio data when reciter changes
  useEffect(() => {
    const fetchAudio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter}`
        );
        const data = await response.json();
        if (data.data?.ayahs) {
          setAudioData(data.data.ayahs);
        }
      } catch (error) {
        console.error('Failed to fetch audio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAudio();
  }, [surahNumber, reciter]);

  // Setup audio element
  useEffect(() => {
    if (!audioData.length) return;
    
    const currentAudioAyah = audioData.find(a => a.numberInSurah === currentAyah);
    if (!currentAudioAyah?.audio) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(currentAudioAyah.audio);
    audioRef.current = audio;
    
    audio.volume = isMuted ? 0 : volume;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      // Auto-play next ayah
      if (currentAyah < ayahs.length) {
        onAyahChange(currentAyah + 1);
      } else {
        setIsPlaying(false);
      }
    });

    audio.addEventListener('waiting', () => setIsLoading(true));
    audio.addEventListener('canplay', () => setIsLoading(false));

    if (isPlaying) {
      audio.play().catch(console.error);
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioData, currentAyah]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const handlePrevious = () => {
    if (currentAyah > 1) {
      onAyahChange(currentAyah - 1);
    }
  };

  const handleNext = () => {
    if (currentAyah < ayahs.length) {
      onAyahChange(currentAyah + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-float"
    >
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{surahName}</p>
            <p className="text-xs text-muted-foreground">
              Ayat {currentAyah} dari {ayahs.length}
            </p>
          </div>
          
          {/* Reciter Selector */}
          <Select value={reciter} onValueChange={setReciter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Pilih Qari" />
            </SelectTrigger>
            <SelectContent>
              {RECITERS.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Volume */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          {/* Previous */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentAyah <= 1}
            className="h-10 w-10"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          {/* Play/Pause */}
          <Button
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isLoading || !audioData.length}
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* Next */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentAyah >= ayahs.length}
            className="h-10 w-10"
          >
            <SkipForward className="w-5 h-5" />
          </Button>

          {/* Volume Slider (desktop) */}
          <div className="hidden sm:flex items-center gap-2 w-24">
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(v) => {
                setVolume(v[0] / 100);
                if (v[0] > 0) setIsMuted(false);
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuranAudioPlayer;
