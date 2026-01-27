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
    <nav className={`fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 z-40 ${
      isElderlyMode ? 'pb-safe' : 'pb-safe'
    }`}>
      {/* Glass effect background */}
      <div className={`mx-3 mb-2 rounded-2xl bg-card/90 backdrop-blur-xl border shadow-lg ${
        isElderlyMode ? 'border-primary/30 shadow-primary/10' : 'border-border/50 shadow-black/5'
      }`}>
        <div className={`flex justify-around items-center ${isElderlyMode ? 'h-20' : 'h-16'} px-1`}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTabChange(item)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 rounded-xl mx-0.5 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                } ${isElderlyMode ? 'gap-1.5' : 'gap-0.5'}`}
                aria-label={item.audioLabel}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className={`absolute inset-1 bg-primary/10 rounded-xl ${
                      isElderlyMode ? 'border-2 border-primary/20' : ''
                    }`}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                
                {/* Icon container */}
                <div className="relative z-10">
                  <Icon 
                    className={`transition-all duration-200 ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'
                    }`}
                    style={{ 
                      width: isElderlyMode ? iconSize.md : 22, 
                      height: isElderlyMode ? iconSize.md : 22 
                    }}
                  />
                  
                  {/* Active dot indicator */}
                  {isActive && !isElderlyMode && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
                
                {/* Label */}
                <span className={`relative z-10 font-medium transition-all duration-200 ${
                  isElderlyMode ? fontSize.sm : 'text-[10px]'
                } ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
