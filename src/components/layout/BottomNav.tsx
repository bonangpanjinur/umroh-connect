import { Home, Briefcase, User, ClipboardCheck, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { TabId } from '@/types';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const navItems: { id: TabId; label: string; icon: typeof Home; audioLabel: string }[] = [
  { id: 'home', label: 'Beranda', icon: Home, audioLabel: 'Beranda' },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, audioLabel: 'Daftar Persiapan' },
  { id: 'paket', label: 'Paket', icon: Briefcase, audioLabel: 'Paket Umroh' },
  { id: 'haji', label: 'Haji', icon: FileText, audioLabel: 'Pendaftaran Haji' },
  { id: 'akun', label: 'Akun', icon: User, audioLabel: 'Akun Saya' },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();

  const handleTabChange = (item: typeof navItems[0]) => {
    // Audio feedback in elderly mode
    if (isElderlyMode && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.audioLabel);
      utterance.lang = 'id-ID';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
    onTabChange(item.id);
  };

  return (
    <nav className={`fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-lg border-t pb-safe z-40 ${
      isElderlyMode ? 'border-t-2 border-primary' : 'border-border'
    }`}>
      <div className={`flex justify-around items-center ${isElderlyMode ? 'h-24' : 'h-16'}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTabChange(item)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary/70'
              } ${isElderlyMode ? 'space-y-2' : 'space-y-1'}`}
              aria-label={item.audioLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute bg-primary/10 rounded-xl ${
                      isElderlyMode ? '-inset-3' : '-inset-2'
                    }`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon 
                  className={`relative z-10 ${isActive ? 'stroke-[2.5]' : ''}`}
                  style={{ 
                    width: isElderlyMode ? iconSize.md : 20, 
                    height: isElderlyMode ? iconSize.md : 20 
                  }}
                />
              </div>
              <span className={`font-medium ${
                isElderlyMode ? fontSize.sm : 'text-[10px]'
              } ${isActive && isElderlyMode ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
