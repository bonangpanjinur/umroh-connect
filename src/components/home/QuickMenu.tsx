import { Compass, Fingerprint, BookOpen, Map } from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { id: 'qibla', label: 'Kiblat', icon: Compass, color: 'text-primary' },
  { id: 'tasbih', label: 'Tasbih', icon: Fingerprint, color: 'text-blue-600' },
  { id: 'doa', label: 'Manasik', icon: BookOpen, color: 'text-purple-600' },
  { id: 'peta', label: 'Peta', icon: Map, color: 'text-accent' },
];

interface QuickMenuProps {
  onMenuClick?: (menuId: string) => void;
}

const QuickMenu = ({ onMenuClick }: QuickMenuProps) => {
  return (
    <div className="px-4 mb-4">
      <h3 className="font-bold text-foreground mb-3 text-sm">Menu Utama</h3>
      <div className="grid grid-cols-4 gap-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMenuClick?.(item.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center shadow-card group-hover:shadow-float transition-all duration-300">
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickMenu;
