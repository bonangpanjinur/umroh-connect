import { useState } from 'react';
import { AlertTriangle, Moon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRamadhanMode } from '@/contexts/RamadhanModeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import GlobalSearch from '@/components/common/GlobalSearch';

interface AppHeaderProps {
  onSOSClick: () => void;
}

const AppHeader = ({ onSOSClick }: AppHeaderProps) => {
  const { isRamadhanMode, toggleRamadhanMode } = useRamadhanMode();
  const { data: platformConfig } = usePlatformConfig();
  const siteName = platformConfig?.site_name || 'Arah Umroh';
  const siteDesc = platformConfig?.site_description || 'Marketplace & Ibadah';
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
    <AnimatePresence>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </AnimatePresence>
    <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-primary ${
            isRamadhanMode ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-primary'
          }`}
        >
          <span className="text-primary-foreground text-lg">{isRamadhanMode ? '🌙' : '🕋'}</span>
        </motion.div>
        <div className="flex flex-col">
          <h1 className="font-bold text-lg text-primary leading-none tracking-tight">
            {isRamadhanMode ? 'Ramadhan Kareem' : siteName}
          </h1>
          <span className="text-[10px] text-muted-foreground font-medium">
            {isRamadhanMode ? 'Mode Ramadhan Aktif ✨' : siteDesc}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Global Search */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSearch(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
          title="Cari"
        >
          <Search className="w-4 h-4" />
        </motion.button>

        {/* Ramadan Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRamadhanMode}
          className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
            isRamadhanMode 
              ? 'bg-amber-500/20 text-amber-600 border-amber-300 dark:border-amber-700' 
              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
          }`}
          title={isRamadhanMode ? 'Matikan Mode Ramadhan' : 'Aktifkan Mode Ramadhan'}
        >
          <Moon className={`w-4 h-4 ${isRamadhanMode ? 'fill-amber-500 text-amber-600' : ''}`} />
          {isRamadhanMode && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background" />
          )}
        </motion.button>

        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-xs font-bold text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
              {language.toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {langOptions.map((opt) => (
              <DropdownMenuItem key={opt.code} onClick={() => setLanguage(opt.code)} className="flex items-center justify-between">
                <span>{opt.flag} {opt.label}</span>
                {language === opt.code && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
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
    </>
  );
};

export default AppHeader;
