import { MapPin, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockPrayerTimes } from '@/data/mockData';

const prayers = [
  { id: 'asr', name: 'Ashar', time: mockPrayerTimes.asr, active: true },
  { id: 'maghrib', name: 'Maghrib', time: mockPrayerTimes.maghrib },
  { id: 'isha', name: 'Isya', time: mockPrayerTimes.isha },
];

const PrayerTimeCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="m-4 p-5 rounded-2xl bg-gradient-primary text-primary-foreground shadow-primary relative overflow-hidden group"
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 text-primary-foreground/10 text-9xl transition-transform duration-700 group-hover:scale-110">
        🕌
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-primary-foreground/80 text-xs mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Makkah, SA
            </p>
            <h2 className="text-3xl font-bold mb-0">Ashar</h2>
            <p className="text-xl opacity-90">
              {mockPrayerTimes.asr}
              <span className="text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded ml-2">
                -00:20:00
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className="block text-xs text-primary-foreground/80">Kiblat</span>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Compass className="w-7 h-7 mt-1 opacity-80" />
            </motion.div>
          </div>
        </div>
        
        {/* Next Prayers */}
        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar text-center text-xs pt-3 border-t border-primary-foreground/10">
          {prayers.map((prayer) => (
            <div
              key={prayer.id}
              className={`px-4 py-2 rounded-xl min-w-[70px] transition-all ${
                prayer.active
                  ? 'bg-primary-foreground/30 border border-primary-foreground/40'
                  : 'bg-primary-foreground/10 hover:bg-primary-foreground/15'
              }`}
            >
              <span className={`block font-semibold ${prayer.active ? 'text-primary-foreground' : 'text-primary-foreground/70'}`}>
                {prayer.name}
              </span>
              <span className="text-primary-foreground/90">{prayer.time}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PrayerTimeCard;
