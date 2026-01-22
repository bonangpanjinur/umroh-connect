import { Home, BookOpen, Briefcase, User, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { TabId } from '@/types';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const navItems: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
  { id: 'paket', label: 'Paket', icon: Briefcase },
  { id: 'akun', label: 'Akun', icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-lg border-t border-border pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
              }`}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-2 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
