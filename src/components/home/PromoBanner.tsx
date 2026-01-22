import { motion } from 'framer-motion';

const promos = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600',
    badge: 'HOT PROMO',
    title: 'Paket Syawal 2026 Hemat',
    subtitle: 'Mulai Rp 24.5 Juta • Seat Terbatas',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1565552629477-087529670247?w=600',
    badge: 'PROMO SPESIAL',
    title: 'Umroh Awal Ramadhan',
    subtitle: 'Berangkat 1 Maret 2026',
  },
];

const PromoBanner = () => {
  return (
    <div className="px-4 mb-6">
      <div className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory">
        {promos.map((promo, index) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="snap-center shrink-0 w-[85%] h-36 rounded-2xl relative overflow-hidden cursor-pointer group"
          >
            <img
              src={promo.image}
              alt={promo.title}
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent flex items-end p-4">
              <div>
                <span className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 rounded font-bold mb-1.5 inline-block">
                  {promo.badge}
                </span>
                <h3 className="text-primary-foreground font-bold text-sm leading-tight">
                  {promo.title}
                </h3>
                <p className="text-primary-foreground/80 text-xs">
                  {promo.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PromoBanner;
