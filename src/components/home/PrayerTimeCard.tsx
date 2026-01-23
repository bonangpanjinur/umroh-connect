import { MapPin, Compass, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockPrayerTimes } from '@/data/mockData';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';

const prayers = [
  { id: 'asr', name: 'Ashar', time: mockPrayerTimes.asr, active: true },
  { id: 'maghrib', name: 'Maghrib', time: mockPrayerTimes.maghrib },
  { id: 'isha', name: 'Isya', time: mockPrayerTimes.isha },
];

const PrayerTimeCard = () => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();

  const speakPrayerTime = () => {
    if (isElderlyMode && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Waktu sholat Ashar pukul ${mockPrayerTimes.asr}. Maghrib pukul ${mockPrayerTimes.maghrib}. Isya pukul ${mockPrayerTimes.isha}`
      );
      utterance.lang = 'id-ID';
      utterance.rate = 0.75;
      speechSynthesis.speak(utterance);
    }
  };

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
              Makkah, SA
            </p>
            <h2 className={`font-bold mb-0 ${isElderlyMode ? 'text-5xl' : 'text-3xl'}`}>
              Ashar
            </h2>
            <p className={`opacity-90 ${isElderlyMode ? 'text-2xl' : 'text-xl'}`}>
              {mockPrayerTimes.asr}
              <span className={`bg-primary-foreground/20 px-1.5 py-0.5 rounded ml-2 ${
                isElderlyMode ? 'text-base' : 'text-xs'
              }`}>
                -00:20:00
              </span>
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
        </div>
        
        {/* Next Prayers */}
        <div className={`flex gap-2 overflow-x-auto hide-scrollbar text-center pt-3 border-t border-primary-foreground/10 ${
          isElderlyMode ? 'mt-5 gap-3' : 'mt-4'
        }`}>
          {prayers.map((prayer) => (
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
      </div>
    </motion.div>
  );
};

export default PrayerTimeCard;
