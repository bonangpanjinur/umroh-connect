import { MapPin, Compass, Volume2, Bell, Droplets, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdzanNotifications } from '@/hooks/useAdzanNotifications';
import { useWeather } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import QiblaModal from '@/components/modals/QiblaModal';
import defaultMasjidImage from '@/assets/default-masjid.jpg';

// Overlay color options
const OVERLAY_COLORS = [
  { id: 'green', color: 'rgba(16, 185, 129, 0.85)', endColor: 'rgba(5, 150, 105, 0.9)', label: 'Hijau' },
  { id: 'blue', color: 'rgba(59, 130, 246, 0.85)', endColor: 'rgba(37, 99, 235, 0.9)', label: 'Biru' },
  { id: 'purple', color: 'rgba(139, 92, 246, 0.85)', endColor: 'rgba(109, 40, 217, 0.9)', label: 'Ungu' },
  { id: 'amber', color: 'rgba(217, 119, 6, 0.85)', endColor: 'rgba(180, 83, 9, 0.9)', label: 'Emas' },
  { id: 'rose', color: 'rgba(244, 63, 94, 0.85)', endColor: 'rgba(225, 29, 72, 0.9)', label: 'Merah' },
];

interface PrayerTimeCardProps {
  onQiblaClick?: () => void;
  onLocationClick?: () => void;
}

const PrayerTimeCard = ({ onQiblaClick, onLocationClick }: PrayerTimeCardProps) => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  const { times, location, loading, currentPrayer, prayerList, refresh } = usePrayerTimes();
  const { preferences, permission, enableAll } = useAdzanNotifications();
  const { makkahWeather, madinahWeather, isLoading: weatherLoading } = useWeather();
  
  // Custom background from localStorage
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [overlayColorId, setOverlayColorId] = useState('green');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showQiblaModal, setShowQiblaModal] = useState(false);
  
  useEffect(() => {
    const savedBg = localStorage.getItem('prayer-card-background');
    const savedColor = localStorage.getItem('prayer-card-overlay-color');
    if (savedBg) setBackgroundImage(savedBg);
    if (savedColor) setOverlayColorId(savedColor);
  }, []);

  const overlayColor = OVERLAY_COLORS.find(c => c.id === overlayColorId) || OVERLAY_COLORS[0];

  const speakPrayerTime = () => {
    if (isElderlyMode && 'speechSynthesis' in window && times) {
      const utterance = new SpeechSynthesisUtterance(
        `Waktu sholat ${currentPrayer?.name || 'Ashar'} pukul ${currentPrayer?.time || times.asr}. 
        Sholat berikutnya ${currentPrayer?.nextPrayer || 'Maghrib'} pukul ${currentPrayer?.nextPrayerTime || times.maghrib}`
      );
      utterance.lang = 'id-ID';
      utterance.rate = 0.75;
      speechSynthesis.speak(utterance);
    }
  };

  const handleEnableNotifications = async () => {
    await enableAll();
  };

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick();
    } else {
      // Request new location
      refresh();
    }
  };

  const handleQiblaClick = () => {
    if (onQiblaClick) {
      onQiblaClick();
    } else {
      setShowQiblaModal(true);
    }
  };

  const handleOverlayColorChange = (colorId: string) => {
    setOverlayColorId(colorId);
    localStorage.setItem('prayer-card-overlay-color', colorId);
    setShowColorPicker(false);
  };

  // Get the actual background to use (custom or default)
  const actualBackgroundImage = backgroundImage || defaultMasjidImage;

  // Loading skeleton
  if (loading && !times) {
    return (
      <div className={`rounded-2xl bg-gradient-primary text-primary-foreground shadow-primary ${
        isElderlyMode ? 'm-5 p-6' : 'm-4 p-4'
      }`}>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
            <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg bg-primary-foreground/20" />
        </div>
      </div>
    );
  }

  // Get next 3 prayers to display
  const upcomingPrayers = prayerList
    .filter(p => !p.passed || p.active)
    .slice(0, 5);

  // If all prayers passed, show first 5 for tomorrow
  const displayPrayers = upcomingPrayers.length > 0 ? upcomingPrayers : prayerList.slice(0, 5);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl text-primary-foreground shadow-primary relative overflow-hidden ${
          isElderlyMode ? 'm-5 p-5' : 'm-4 p-4'
        }`}
        style={{
          backgroundImage: `linear-gradient(to bottom, ${overlayColor.color}, ${overlayColor.endColor}), url(${actualBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          {/* Top Row - Location, Current Prayer, Qibla */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleLocationClick}
              className="flex items-center gap-2 hover:bg-primary-foreground/10 rounded-lg px-2 py-1 -ml-2 transition-colors"
            >
              <MapPin className={`${isElderlyMode ? 'w-4 h-4' : 'w-3.5 h-3.5'} opacity-80`} />
              <span className={`opacity-90 ${isElderlyMode ? fontSize.sm : 'text-xs'}`}>
                {location ? `${location.city}` : 'Memuat...'}
              </span>
            </button>
            <div className="flex items-center gap-2">
              {/* Color picker toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                  aria-label="Ubah warna overlay"
                >
                  <Palette className="w-4 h-4" />
                </button>
                
                {/* Color picker dropdown */}
                {showColorPicker && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-2 bg-background rounded-lg shadow-lg p-2 flex gap-1 z-50"
                  >
                    {OVERLAY_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleOverlayColorChange(color.id)}
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                          overlayColorId === color.id ? 'ring-2 ring-white ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color.color.replace('0.85', '1') }}
                        title={color.label}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {permission !== 'granted' ? (
                <button
                  onClick={handleEnableNotifications}
                  className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                  aria-label="Aktifkan notifikasi adzan"
                >
                  <Bell className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleQiblaClick}
                  className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                  aria-label="Arah kiblat"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Compass className="w-4 h-4" />
                  </motion.div>
                </button>
              )}
              {isElderlyMode && (
                <button
                  onClick={speakPrayerTime}
                  className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                  aria-label="Dengarkan waktu sholat"
                >
                  <Volume2 style={{ width: iconSize.md, height: iconSize.md }} />
                </button>
              )}
            </div>
          </div>

          {/* Center - Current Prayer Time (Hero) */}
          <div className="text-center mb-3">
            <h2 className={`font-bold ${isElderlyMode ? 'text-4xl' : 'text-2xl'}`}>
              {currentPrayer?.name || 'Sholat'}
            </h2>
            <p className={`font-semibold ${isElderlyMode ? 'text-3xl' : 'text-xl'} opacity-95`}>
              {currentPrayer?.time || times?.asr || '--:--'}
              {currentPrayer?.countdown && (
                <span className={`bg-primary-foreground/20 px-2 py-0.5 rounded ml-2 ${
                  isElderlyMode ? 'text-base' : 'text-xs'
                }`}>
                  {currentPrayer.countdown}
                </span>
              )}
            </p>
          </div>
          
          {/* Prayer Times Row - Compact horizontal scroll */}
          <div className={`flex gap-1.5 overflow-x-auto hide-scrollbar justify-center mb-3`}>
            {displayPrayers.map((prayer) => (
              <div
                key={prayer.id}
                className={`rounded-lg transition-all text-center flex-shrink-0 ${
                  isElderlyMode ? 'px-4 py-2' : 'px-3 py-1.5'
                } ${
                  prayer.active
                    ? 'bg-primary-foreground/30 border border-primary-foreground/40'
                    : 'bg-primary-foreground/10'
                }`}
              >
                <span className={`block font-medium ${
                  isElderlyMode ? fontSize.sm : 'text-[10px]'
                } ${prayer.active ? 'text-primary-foreground' : 'text-primary-foreground/70'}`}>
                  {prayer.name}
                </span>
                <span className={`text-primary-foreground/90 ${
                  isElderlyMode ? fontSize.base + ' font-bold' : 'text-xs font-semibold'
                }`}>
                  {prayer.time}
                </span>
              </div>
            ))}
          </div>

          {/* Weather Strip - Compact */}
          <div className="flex gap-2">
            {weatherLoading ? (
              <>
                <Skeleton className="flex-1 h-8 rounded-lg bg-primary-foreground/20" />
                <Skeleton className="flex-1 h-8 rounded-lg bg-primary-foreground/20" />
              </>
            ) : (
              <>
                {makkahWeather && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-primary-foreground/10">
                    <span className="text-sm">{makkahWeather.icon}</span>
                    <span className={`font-medium ${isElderlyMode ? fontSize.sm : 'text-xs'}`}>
                      Makkah
                    </span>
                    <span className={`font-bold ${isElderlyMode ? fontSize.sm : 'text-xs'}`}>
                      {makkahWeather.temperature}°
                    </span>
                    <span className={`flex items-center gap-0.5 opacity-70 ${isElderlyMode ? fontSize.xs : 'text-[10px]'}`}>
                      <Droplets className="w-2.5 h-2.5" />
                      {makkahWeather.humidity}%
                    </span>
                  </div>
                )}
                {madinahWeather && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-primary-foreground/10">
                    <span className="text-sm">{madinahWeather.icon}</span>
                    <span className={`font-medium ${isElderlyMode ? fontSize.sm : 'text-xs'}`}>
                      Madinah
                    </span>
                    <span className={`font-bold ${isElderlyMode ? fontSize.sm : 'text-xs'}`}>
                      {madinahWeather.temperature}°
                    </span>
                    <span className={`flex items-center gap-0.5 opacity-70 ${isElderlyMode ? fontSize.xs : 'text-[10px]'}`}>
                      <Droplets className="w-2.5 h-2.5" />
                      {madinahWeather.humidity}%
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Notification status indicator */}
          {!isElderlyMode && preferences.enabled && permission === 'granted' && (
            <div className="flex items-center justify-center gap-1 mt-2 text-primary-foreground/60">
              <Bell className="w-2.5 h-2.5" />
              <span className="text-[9px]">Notifikasi adzan aktif</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Qibla Modal */}
      <QiblaModal 
        isOpen={showQiblaModal} 
        onClose={() => setShowQiblaModal(false)} 
      />
    </>
  );
};

export default PrayerTimeCard;
