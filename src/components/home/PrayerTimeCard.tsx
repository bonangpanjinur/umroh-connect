import { MapPin, Compass, Volume2, Bell, Droplets, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdzanNotifications } from '@/hooks/useAdzanNotifications';
import { useWeather } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

const PrayerTimeCard = () => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  const { times, location, loading, currentPrayer, prayerList } = usePrayerTimes();
  const { preferences, permission, enableAll } = useAdzanNotifications();
  const { makkahWeather, madinahWeather, isLoading: weatherLoading } = useWeather();
  
  // Custom background from localStorage
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  useEffect(() => {
    const savedBg = localStorage.getItem('prayer-card-background');
    if (savedBg) setBackgroundImage(savedBg);
  }, []);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl text-primary-foreground shadow-primary relative overflow-hidden ${
        isElderlyMode ? 'm-5 p-5' : 'm-4 p-4'
      }`}
      style={{
        backgroundImage: backgroundImage 
          ? `linear-gradient(to bottom, rgba(16, 185, 129, 0.85), rgba(5, 150, 105, 0.9)), url(${backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Default gradient background if no custom image */}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-gradient-primary -z-10" />
      )}
      
      <div className="relative z-10">
        {/* Top Row - Location, Current Prayer, Qibla */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className={`${isElderlyMode ? 'w-4 h-4' : 'w-3.5 h-3.5'} opacity-80`} />
            <span className={`opacity-90 ${isElderlyMode ? fontSize.sm : 'text-xs'}`}>
              {location ? `${location.city}` : 'Memuat...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {permission !== 'granted' ? (
              <button
                onClick={handleEnableNotifications}
                className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                aria-label="Aktifkan notifikasi adzan"
              >
                <Bell className="w-4 h-4" />
              </button>
            ) : (
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="p-1.5 rounded-lg bg-primary-foreground/20"
              >
                <Compass className="w-4 h-4" />
              </motion.div>
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
  );
};

export default PrayerTimeCard;