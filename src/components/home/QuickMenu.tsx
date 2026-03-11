import { Compass, Fingerprint, BookOpen, Map, HandHeart, Volume2, DollarSign, Book, Flame, Sparkles, BookHeart, Wallet, ClipboardCheck, Moon, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { useRamadhanMode } from '@/contexts/RamadhanModeContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  audioLabel: string;
  isCore?: boolean;
  gradient?: string;
  shadow?: string;
  color?: string;
  isHighlight?: boolean;
  highlightColor?: string;
}

const menuItems: MenuItem[] = [
  // Row 1 - Spiritual core (gradient style)
  { id: 'manasik', label: 'Manasik', icon: BookOpen, gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/25', isCore: true, audioLabel: 'Panduan Manasik' },
  { id: 'doaharian', label: 'Doa', icon: HandHeart, gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/25', isCore: true, audioLabel: 'Doa Harian' },
  { id: 'quran', label: 'Al-Quran', icon: Book, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25', isCore: true, audioLabel: 'Al-Quran' },
  { id: 'qibla', label: 'Kiblat', icon: Compass, gradient: 'from-sky-500 to-sky-600', shadow: 'shadow-sky-500/25', isCore: true, audioLabel: 'Arah Kiblat' },
  // Row 2-3 - Utilitas
  { id: 'tasbih', label: 'Tasbih', icon: Fingerprint, color: 'text-blue-600', audioLabel: 'Tasbih Digital' },
  { id: 'ibadah', label: 'Tracker', icon: Flame, color: 'text-primary', audioLabel: 'Tracker Ibadah', isHighlight: true, highlightColor: 'primary' },
  { id: 'peta', label: 'Peta', icon: Map, color: 'text-accent', audioLabel: 'Peta Lokasi' },
  { id: 'tabungan', label: 'Kalkulator', icon: Wallet, color: 'text-emerald-600', audioLabel: 'Kalkulator Islami' },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, color: 'text-blue-500', audioLabel: 'Checklist Persiapan' },
  { id: 'kurs', label: 'Kurs', icon: DollarSign, color: 'text-emerald-600', audioLabel: 'Konversi Kurs' },
  { id: 'journal', label: 'Jurnal', icon: BookHeart, color: 'text-pink-500', audioLabel: 'Jurnal Ibadah' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, color: 'text-amber-600', audioLabel: 'Belanja Oleh-oleh' },
];

const ramadanMenuItems: MenuItem[] = [
  // Row 1 - Ramadan spiritual core
  { id: 'ibadah', label: 'Ramadhan', icon: Moon, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25', isCore: true, audioLabel: 'Dashboard Ramadhan' },
  { id: 'doaharian', label: 'Doa', icon: HandHeart, gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/25', isCore: true, audioLabel: 'Doa Harian' },
  { id: 'quran', label: 'Al-Quran', icon: Book, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25', isCore: true, audioLabel: 'Al-Quran & Tadarus' },
  { id: 'qibla', label: 'Kiblat', icon: Compass, gradient: 'from-sky-500 to-sky-600', shadow: 'shadow-sky-500/25', isCore: true, audioLabel: 'Arah Kiblat' },
  // Row 2-3
  { id: 'manasik', label: 'Manasik', icon: BookOpen, color: 'text-purple-600', audioLabel: 'Panduan Manasik' },
  { id: 'tasbih', label: 'Tasbih', icon: Fingerprint, color: 'text-blue-600', audioLabel: 'Tasbih Digital' },
  { id: 'tabungan', label: 'Kalkulator', icon: Wallet, color: 'text-emerald-600', audioLabel: 'Kalkulator Islami' },
  { id: 'peta', label: 'Peta', icon: Map, color: 'text-accent', audioLabel: 'Peta Lokasi' },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, color: 'text-blue-500', audioLabel: 'Checklist Persiapan' },
  { id: 'kurs', label: 'Kurs', icon: DollarSign, color: 'text-emerald-600', audioLabel: 'Konversi Kurs' },
  { id: 'journal', label: 'Jurnal', icon: BookHeart, color: 'text-pink-500', audioLabel: 'Jurnal Ibadah' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, color: 'text-amber-600', audioLabel: 'Belanja Oleh-oleh' },
];

interface QuickMenuProps {
  onMenuClick?: (menuId: string) => void;
}

const QuickMenu = ({ onMenuClick }: QuickMenuProps) => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  const { isRamadhanMode } = useRamadhanMode();

  const activeMenuItems = isRamadhanMode ? ramadanMenuItems : menuItems;
  const displayItems = isElderlyMode ? activeMenuItems.slice(0, 8) : activeMenuItems;

  const handleClick = (item: MenuItem) => {
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
        <h3 className={`font-bold text-foreground ${fontSize.sm}`}>Menu</h3>
        {isElderlyMode && (
          <div className="flex items-center gap-1.5 text-primary">
            <Volume2 className="w-4 h-4" />
            <span className={`${fontSize.xs}`}>Audio Aktif</span>
          </div>
        )}
      </div>
      
      <div className={`grid grid-cols-4 ${isElderlyMode ? 'gap-4' : 'gap-3'}`}>
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          const isCore = item.isCore;
          const isHighlight = item.isHighlight;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.03 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center gap-1.5 group relative"
              aria-label={item.audioLabel}
            >
              {/* Highlight badge for special items */}
              {isHighlight && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 z-10">
                  <span className="flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-primary text-[7px] text-primary-foreground">
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  </span>
                </motion.div>
              )}

              <div className={`rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isCore
                  ? `bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-lg w-14 h-14`
                  : isHighlight
                    ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 w-14 h-14 border-0'
                    : `bg-card border border-border shadow-card group-hover:shadow-float ${isElderlyMode ? 'w-18 h-18' : 'w-14 h-14'}`
              }`}>
                <Icon
                  className={isCore ? 'text-white' : isHighlight ? 'text-primary-foreground' : (item.color || 'text-muted-foreground')}
                  style={{
                    width: isElderlyMode ? iconSize.lg : isCore ? 24 : 22,
                    height: isElderlyMode ? iconSize.lg : isCore ? 24 : 22,
                  }}
                />
              </div>
              <span className={`font-medium text-center leading-tight ${
                isCore ? 'text-foreground font-semibold' 
                  : isHighlight ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              } ${isElderlyMode ? fontSize.sm : 'text-[10px]'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {isElderlyMode && (
        <p className={`text-center text-muted-foreground mt-4 ${fontSize.xs}`}>
          Tekan tombol untuk membuka fitur. Audio akan berbunyi.
        </p>
      )}
    </div>
  );
};

export default QuickMenu;
