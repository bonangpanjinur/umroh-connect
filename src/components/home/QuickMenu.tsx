import { Compass, Fingerprint, BookOpen, Map, Bell, BookHeart, HandHeart, BellRing, Volume2, CloudDownload, Briefcase, DollarSign, MapPin, MessageSquare, Book, Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';

const menuItems = [
  { id: 'habit', label: 'Habit Ibadah', icon: Flame, color: 'text-primary', audioLabel: 'Habit Ibadah Harian', isHighlight: true },
  { id: 'qibla', label: 'Kiblat', icon: Compass, color: 'text-primary', audioLabel: 'Arah Kiblat' },
  { id: 'tasbih', label: 'Tasbih', icon: Fingerprint, color: 'text-blue-600', audioLabel: 'Tasbih Digital' },
  { id: 'quran', label: 'Al-Quran', icon: Book, color: 'text-emerald-700', audioLabel: 'Al Quran Digital' },
  { id: 'doa', label: 'Manasik', icon: BookOpen, color: 'text-purple-600', audioLabel: 'Panduan Manasik' },
  { id: 'doaharian', label: 'Doa', icon: HandHeart, color: 'text-orange-500', audioLabel: 'Doa Harian' },
  { id: 'peta', label: 'Peta', icon: Map, color: 'text-accent', audioLabel: 'Peta Lokasi' },
  { id: 'reviews', label: 'Testimoni', icon: MessageSquare, color: 'text-emerald-500', audioLabel: 'Testimoni Jamaah' },
  { id: 'tracking', label: 'Tracking', icon: MapPin, color: 'text-rose-500', audioLabel: 'Tracking Grup' },
  { id: 'reminder', label: 'Pengingat', icon: Bell, color: 'text-red-500', audioLabel: 'Pengingat' },
  { id: 'notifikasi', label: 'Notifikasi', icon: BellRing, color: 'text-amber-500', audioLabel: 'Notifikasi' },
  { id: 'kurs', label: 'Kurs', icon: DollarSign, color: 'text-emerald-600', audioLabel: 'Konversi Kurs' },
  { id: 'packing', label: 'Packing', icon: Briefcase, color: 'text-teal-500', audioLabel: 'Daftar Packing' },
  { id: 'offline', label: 'Offline', icon: CloudDownload, color: 'text-cyan-500', audioLabel: 'Mode Offline' },
  { id: 'journal', label: 'Jurnal', icon: BookHeart, color: 'text-pink-500', audioLabel: 'Jurnal Ibadah' },
];

interface QuickMenuProps {
  onMenuClick?: (menuId: string) => void;
}

const QuickMenu = ({ onMenuClick }: QuickMenuProps) => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();

  // In elderly mode, show simplified menu with larger buttons
  const displayItems = isElderlyMode ? menuItems.slice(0, 6) : menuItems;
  const gridCols = isElderlyMode ? 'grid-cols-3' : 'grid-cols-4';

  const handleClick = (item: typeof menuItems[0]) => {
    // In elderly mode, use speech synthesis for audio feedback
    if (isElderlyMode && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.audioLabel);
      utterance.lang = 'id-ID';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
    onMenuClick?.(item.id);
  };

  return (
    <div className={`mb-4 ${isElderlyMode ? 'px-5' : 'px-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-foreground ${fontSize.sm}`}>
          {isElderlyMode ? 'Menu Utama' : 'Menu Utama'}
        </h3>
        {isElderlyMode && (
          <div className="flex items-center gap-1.5 text-primary">
            <Volume2 className="w-4 h-4" />
            <span className={`${fontSize.xs}`}>Audio Aktif</span>
          </div>
        )}
      </div>
      
      <div className={`grid ${gridCols} ${isElderlyMode ? 'gap-4' : 'gap-3'}`}>
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          const isHighlight = 'isHighlight' in item && item.isHighlight;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center gap-2 group relative"
              aria-label={item.audioLabel}
            >
              {/* Highlight Badge */}
              {isHighlight && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 z-10"
                >
                  <span className="flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-primary text-[8px] text-primary-foreground font-bold">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </span>
                </motion.div>
              )}
              
              <div className={`rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isHighlight 
                  ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 border-0' 
                  : 'bg-card border border-border shadow-card group-hover:shadow-float'
              } ${
                isElderlyMode 
                  ? 'w-20 h-20 border-2' 
                  : 'w-14 h-14'
              }`}>
                <Icon 
                  className={isHighlight ? 'text-primary-foreground' : item.color}
                  style={{ 
                    width: isElderlyMode ? iconSize.lg : 24, 
                    height: isElderlyMode ? iconSize.lg : 24 
                  }} 
                />
              </div>
              <span className={`font-medium text-center ${
                isHighlight ? 'text-primary font-semibold' : 'text-muted-foreground'
              } ${
                isElderlyMode ? fontSize.sm : 'text-[10px]'
              }`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Audio instruction for elderly mode */}
      {isElderlyMode && (
        <p className={`text-center text-muted-foreground mt-4 ${fontSize.xs}`}>
          Tekan tombol untuk membuka fitur. Audio akan berbunyi.
        </p>
      )}
    </div>
  );
};

export default QuickMenu;
