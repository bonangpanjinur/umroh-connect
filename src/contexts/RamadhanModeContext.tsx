import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isCurrentlyRamadan } from '@/hooks/useRamadhanDashboard';

interface RamadhanModeContextType {
  isRamadhanMode: boolean;
  setRamadhanMode: (val: boolean) => void;
  toggleRamadhanMode: () => void;
}

const RamadhanModeContext = createContext<RamadhanModeContextType>({
  isRamadhanMode: false,
  setRamadhanMode: () => {},
  toggleRamadhanMode: () => {},
});

export const useRamadhanMode = () => useContext(RamadhanModeContext);

export const RamadhanModeProvider = ({ children }: { children: ReactNode }) => {
  const [isRamadhanMode, setIsRamadhanMode] = useState(() => {
    try {
      const saved = localStorage.getItem('ramadhan_mode');
      if (saved !== null) return saved === 'true';
      return isCurrentlyRamadan();
    } catch {
      return isCurrentlyRamadan();
    }
  });

  useEffect(() => {
    localStorage.setItem('ramadhan_mode', isRamadhanMode.toString());
  }, [isRamadhanMode]);

  const setRamadhanMode = (val: boolean) => setIsRamadhanMode(val);
  const toggleRamadhanMode = () => setIsRamadhanMode(prev => !prev);

  return (
    <RamadhanModeContext.Provider value={{ isRamadhanMode, setRamadhanMode, toggleRamadhanMode }}>
      {children}
    </RamadhanModeContext.Provider>
  );
};
