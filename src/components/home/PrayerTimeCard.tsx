import { MapPin, Compass, Volume2, Bell, Droplets, Palette, Clock, Moon, Sunset } from 'lucide-react';
import { motion } from 'framer-motion';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { useRamadhanMode } from '@/contexts/RamadhanModeContext';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdzanNotifications } from '@/hooks/useAdzanNotifications';
import { useWeather } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback, useRef } from 'react';
import QiblaModal from '@/components/modals/QiblaModal';
import defaultMasjidImage from '@/assets/default-masjid.jpg';
import { PrayerTimes } from '@/types';

// Live countdown hook that ticks every second
const useLiveCountdown = (times: PrayerTimes | null) => {
  const [now, setNow] = useState(() => new Date());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Update every second
    intervalRef.current = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  if (!times) return { currentTime: '--:--:--', currentPrayerName: 'Sholat', currentPrayerTime: '--:--', nextPrayerName: '', nextPrayerTime: '', countdown: '' };

  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const prayerOrder: { key: keyof PrayerTimes; name: string }[] = [
    { key: 'fajr', name: 'Subuh' },
    { key: 'dhuhr', name: 'Dzuhur' },
    { key: 'asr', name: 'Ashar' },
    { key: 'maghrib', name: 'Maghrib' },
    { key: 'isha', name: 'Isya' },
  ];

  const prayerSeconds = prayerOrder.map(p => {
    const [h, m] = times[p.key].split(':').map(Number);
    return { ...p, seconds: h * 3600 + m * 60 };
  });

  let currentPrayerName = 'Isya';
  let currentPrayerTime = times.isha;
  let nextPrayerName = 'Subuh';
  let nextPrayerTime = times.fajr;
  let nextSeconds = prayerSeconds[0].seconds + 86400;

  for (let i = 0; i < prayerSeconds.length; i++) {
    const cur = prayerSeconds[i];
    const next = prayerSeconds[i + 1];
    if (next) {
      if (currentSeconds >= cur.seconds && currentSeconds < next.seconds) {
        currentPrayerName = cur.name;
        currentPrayerTime = times[cur.key];
        nextPrayerName = next.name;
        nextPrayerTime = times[next.key];
        nextSeconds = next.seconds;
        break;
      }
    } else {
      if (currentSeconds >= cur.seconds) {
        currentPrayerName = 'Isya';
        currentPrayerTime = times.isha;
        nextPrayerName = 'Subuh';
        nextPrayerTime = times.fajr;
        nextSeconds = prayerSeconds[0].seconds + 86400;
      } else if (currentSeconds < prayerSeconds[0].seconds) {
        currentPrayerName = 'Isya';
        currentPrayerTime = times.isha;
        nextPrayerName = 'Subuh';
        nextPrayerTime = times.fajr;
        nextSeconds = prayerSeconds[0].seconds;
      }
    }
  }

  let remaining = nextSeconds - currentSeconds;
  if (remaining < 0) remaining += 86400;

  const rh = Math.floor(remaining / 3600);
  const rm = Math.floor((remaining % 3600) / 60);
  const rs = remaining % 60;
  const countdown = `-${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}:${String(rs).padStart(2, '0')}`;

  return { currentTime, currentPrayerName, currentPrayerTime, nextPrayerName, nextPrayerTime, countdown };
};

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
  const { isRamadhanMode } = useRamadhanMode();
  const { times, location, loading, prayerList, refresh } = usePrayerTimes();
  const { preferences, permission, enableAll } = useAdzanNotifications();
  const { makkahWeather, madinahWeather, isLoading: weatherLoading } = useWeather();
  const live = useLiveCountdown(times);
  
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
        `Waktu sholat ${live.currentPrayerName} pukul ${live.currentPrayerTime}. 
        Sholat berikutnya ${live.nextPrayerName} pukul ${live.nextPrayerTime}`
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

  // Get next prayers to display
  const upcomingPrayers = prayerList
    .filter(p => !p.passed || p.active)
    .slice(0, 5);

  // If all prayers passed, show first 5 for tomorrow
  const displayPrayers = upcomingPrayers.length > 0 ? upcomingPrayers : prayerList.slice(0, 5);

  // Ramadan extra times from API
  const imsakTime = (times as any)?.imsak || null;
  const iftarTime = times?.maghrib || null;

  // Calculate iftar countdown
  const getIftarCountdown = () => {
    if (!iftarTime) return '';
    const now = new Date();
    const [h, m] = iftarTime.split(':').map(Number);
    const iftarSec = h * 3600 + m * 60;
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let remaining = iftarSec - nowSec;
    if (remaining <= 0) return '';
    const rh = Math.floor(remaining / 3600);
    const rm = Math.floor((remaining % 3600) / 60);
    return `${rh}j ${rm}m`;
  };

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

          {/* Center - Current Time & Prayer Info (Hero) */}
          <div className="text-center mb-3">
            <div className={`font-mono font-bold ${isElderlyMode ? 'text-4xl' : 'text-3xl'} tracking-wider`}>
              {live.currentTime}
            </div>
            <h2 className={`font-semibold mt-1 ${isElderlyMode ? 'text-2xl' : 'text-lg'}`}>
              {live.currentPrayerName}
              <span className={`opacity-80 ml-2 ${isElderlyMode ? 'text-lg' : 'text-sm'}`}>
                {live.currentPrayerTime}
              </span>
            </h2>
            <p className={`opacity-90 ${isElderlyMode ? 'text-base' : 'text-xs'} mt-1`}>
              <span className="opacity-70">Menuju {live.nextPrayerName}</span>
              <span className={`bg-primary-foreground/20 px-2 py-0.5 rounded ml-2 font-mono font-semibold ${
                isElderlyMode ? 'text-base' : 'text-sm'
              }`}>
                {live.countdown}
              </span>
            </p>
          </div>

          {/* Ramadan Imsak & Iftar Strip */}
          {isRamadhanMode && imsakTime && (
            <div className="flex gap-2 mb-3">
              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/15 border border-primary-foreground/20">
                <Moon className="w-3.5 h-3.5 text-yellow-300" />
                <div className="text-center">
                  <span className="text-[10px] block opacity-70">Imsak</span>
                  <span className="text-sm font-bold">{imsakTime}</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/15 border border-primary-foreground/20">
                <Sunset className="w-3.5 h-3.5 text-orange-300" />
                <div className="text-center">
                  <span className="text-[10px] block opacity-70">Berbuka</span>
                  <span className="text-sm font-bold">{iftarTime}</span>
                </div>
                {getIftarCountdown() && (
                  <Badge className="bg-orange-500/80 text-white text-[9px] px-1.5 py-0">
                    {getIftarCountdown()}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
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
