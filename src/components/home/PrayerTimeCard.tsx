import { MapPin, Compass, Volume2, Bell, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdzanNotifications } from '@/hooks/useAdzanNotifications';
import { Skeleton } from '@/components/ui/skeleton';

const PrayerTimeCard = () => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  const { times, location, loading, currentPrayer, prayerList } = usePrayerTimes();
  const { preferences, permission, enableAll } = useAdzanNotifications();

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
        isElderlyMode ? 'm-5 p-6' : 'm-4 p-5'
      }`}>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
            <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
            <Skeleton className="h-6 w-20 bg-primary-foreground/20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg bg-primary-foreground/20" />
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-primary-foreground/10">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-20 rounded-xl bg-primary-foreground/20" />
          ))}
        </div>
      </div>
    );
  }

  // Get next 3 prayers to display
  const upcomingPrayers = prayerList
    .filter(p => !p.passed || p.active)
    .slice(0, 3);

  // If all prayers passed, show first 3 for tomorrow
  const displayPrayers = upcomingPrayers.length > 0 ? upcomingPrayers : prayerList.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl bg-gradient-primary text-primary-foreground shadow-primary relative overflow-hidden group ${
        isElderlyMode ? 'm-5 p-6' : 'm-4 p-5'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 text-primary-foreground/10 text-9xl transition-transform duration-700 group-hover:scale-110">
        🕌
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className={`text-primary-foreground/80 mb-1 flex items-center gap-1 ${fontSize.xs}`}>
              <MapPin style={{ width: isElderlyMode ? 16 : 12, height: isElderlyMode ? 16 : 12 }} /> 
              {location ? `${location.city}${location.country ? `, ${location.country}` : ''}` : 'Lokasi...'}
            </p>
            <h2 className={`font-bold mb-0 ${isElderlyMode ? 'text-5xl' : 'text-3xl'}`}>
              {currentPrayer?.name || 'Sholat'}
            </h2>
            <p className={`opacity-90 ${isElderlyMode ? 'text-2xl' : 'text-xl'}`}>
              {currentPrayer?.time || times?.asr || '--:--'}
              {currentPrayer?.countdown && (
                <span className={`bg-primary-foreground/20 px-1.5 py-0.5 rounded ml-2 ${
                  isElderlyMode ? 'text-base' : 'text-xs'
                }`}>
                  {currentPrayer.countdown}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            {isElderlyMode ? (
              <button
                onClick={speakPrayerTime}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                aria-label="Dengarkan waktu sholat"
              >
                <Volume2 style={{ width: iconSize.lg, height: iconSize.lg }} />
                <span className={`block ${fontSize.xs} text-primary-foreground/80`}>Audio</span>
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {permission !== 'granted' ? (
                  <button
                    onClick={handleEnableNotifications}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                    aria-label="Aktifkan notifikasi adzan"
                  >
                    <Bell className="w-6 h-6 opacity-80" />
                    <span className="block text-[10px] text-primary-foreground/80">Adzan</span>
                  </button>
                ) : (
                  <>
                    <span className="block text-xs text-primary-foreground/80">Kiblat</span>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Compass className="w-7 h-7 mt-1 opacity-80" />
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Next Prayers */}
        <div className={`flex gap-2 overflow-x-auto hide-scrollbar text-center pt-3 border-t border-primary-foreground/10 ${
          isElderlyMode ? 'mt-5 gap-3' : 'mt-4'
        }`}>
          {displayPrayers.map((prayer) => (
            <div
              key={prayer.id}
              className={`rounded-xl transition-all ${
                isElderlyMode ? 'px-6 py-3 min-w-[100px]' : 'px-4 py-2 min-w-[70px]'
              } ${
                prayer.active
                  ? 'bg-primary-foreground/30 border border-primary-foreground/40'
                  : 'bg-primary-foreground/10 hover:bg-primary-foreground/15'
              }`}
            >
              <span className={`block font-semibold ${
                isElderlyMode ? fontSize.base : 'text-xs'
              } ${prayer.active ? 'text-primary-foreground' : 'text-primary-foreground/70'}`}>
                {prayer.name}
              </span>
              <span className={`text-primary-foreground/90 ${
                isElderlyMode ? fontSize.lg + ' font-bold' : 'text-xs'
              }`}>
                {prayer.time}
              </span>
            </div>
          ))}
        </div>

        {/* Audio instruction for elderly mode */}
        {isElderlyMode && (
          <p className={`text-center text-primary-foreground/70 mt-4 ${fontSize.xs}`}>
            Tekan tombol Audio untuk mendengarkan waktu sholat
          </p>
        )}

        {/* Notification status indicator */}
        {!isElderlyMode && preferences.enabled && permission === 'granted' && (
          <div className="flex items-center justify-center gap-1 mt-3 text-primary-foreground/60">
            <Bell className="w-3 h-3" />
            <span className="text-[10px]">Notifikasi adzan aktif</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PrayerTimeCard;
