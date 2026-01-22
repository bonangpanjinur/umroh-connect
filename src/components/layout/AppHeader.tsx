import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppHeaderProps {
  onSOSClick: () => void;
}

const AppHeader = ({ onSOSClick }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary"
        >
          <span className="text-primary-foreground text-lg">🕋</span>
        </motion.div>
        <div className="flex flex-col">
          <h1 className="font-bold text-lg text-primary leading-none tracking-tight">
            Arah Umroh
          </h1>
          <span className="text-[10px] text-muted-foreground font-medium">
            Marketplace & Ibadah
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button className="text-xs font-bold text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
          ID
        </button>
        
        {/* SOS Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSOSClick}
          className="relative w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20"
        >
          <span className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse-ring" />
          <AlertTriangle className="w-4 h-4 relative z-10" />
        </motion.button>
      </div>
    </header>
  );
};

export default AppHeader;
