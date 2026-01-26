import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ManasikAudioPlayerProps {
  audioUrl?: string | null;
  doaArabic?: string | null;
  doaLatin?: string | null;
  doaMeaning?: string | null;
  title: string;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ManasikAudioPlayer = ({ 
  audioUrl, 
  doaArabic, 
  doaLatin, 
  doaMeaning,
  title 
}: ManasikAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showDoa, setShowDoa] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.addEventListener('loadstart', () => setIsLoading(true));
      audioRef.current.addEventListener('canplay', () => setIsLoading(false));
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        const audio = audioRef.current;
        if (audio) {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });
      audioRef.current.addEventListener('error', () => {
        setError('Gagal memuat audio');
        setIsLoading(false);
      });

      return () => {
        audioRef.current?.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Audio play error:', err);
      setError('Tidak dapat memutar audio');
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(value[0]);
    }
  };

  const hasDoaContent = doaArabic || doaLatin || doaMeaning;
  const hasAudio = !!audioUrl;

  if (!hasDoaContent && !hasAudio) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-border overflow-hidden">
      {/* Doa Content Section */}
      {hasDoaContent && (
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setShowDoa(!showDoa)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              🤲 Bacaan Doa
            </span>
            <motion.span
              animate={{ rotate: showDoa ? 180 : 0 }}
              className="text-muted-foreground"
            >
              ▼
            </motion.span>
          </button>
          
          <motion.div
            initial={false}
            animate={{ height: showDoa ? 'auto' : 0, opacity: showDoa ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {doaArabic && (
                <div className="bg-card/50 rounded-xl p-3">
                  <p className="text-lg font-arabic text-foreground text-right leading-loose">
                    {doaArabic}
                  </p>
                </div>
              )}
              {doaLatin && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Latin:</p>
                  <p className="text-sm text-foreground italic">{doaLatin}</p>
                </div>
              )}
              {doaMeaning && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Arti:</p>
                  <p className="text-sm text-muted-foreground">{doaMeaning}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Audio Player Section */}
      {hasAudio && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              disabled={isLoading || !!error}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all",
                error 
                  ? "bg-destructive/20 text-destructive cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:brightness-110"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">
                  {error || `Audio Doa - ${title}`}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleRestart}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Putar ulang"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Progress Bar (clickable) */}
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleSeek}
                className="h-1.5"
              />
              
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {formatTime(currentTime)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Volume Slider */}
          <div className="flex items-center gap-2 pl-14">
            <Volume2 className="w-3 h-3 text-muted-foreground" />
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => {
                setVolume(value[0] / 100);
                if (value[0] > 0) setIsMuted(false);
              }}
              className="flex-1 max-w-[100px]"
            />
          </div>
        </div>
      )}

      {/* No Audio Message */}
      {hasDoaContent && !hasAudio && (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Audio untuk doa ini belum tersedia
          </p>
        </div>
      )}
    </div>
  );
};

export default ManasikAudioPlayer;
