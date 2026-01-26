import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ElderlyModeContextType {
  isElderlyMode: boolean;
  toggleElderlyMode: () => void;
  setElderlyMode: (value: boolean) => void;
  // Sizing helpers
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  spacing: {
    sm: string;
    md: string;
    lg: string;
  };
  iconSize: {
    sm: number;
    md: number;
    lg: number;
  };
}

const ElderlyModeContext = createContext<ElderlyModeContextType | undefined>(undefined);

const STORAGE_KEY = 'arah-umroh-elderly-mode';

export const ElderlyModeProvider = ({ children }: { children: ReactNode }) => {
  const [isElderlyMode, setIsElderlyMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isElderlyMode));
    
    // Apply global class for CSS targeting
    if (isElderlyMode) {
      document.documentElement.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
    }
  }, [isElderlyMode]);

  const toggleElderlyMode = () => setIsElderlyMode(prev => !prev);
  const setElderlyMode = (value: boolean) => setIsElderlyMode(value);

  // Dynamic sizing based on mode
  const fontSize = isElderlyMode
    ? {
        xs: 'text-base',      // 16px (was 12px)
        sm: 'text-lg',        // 18px (was 14px)
        base: 'text-xl',      // 20px (was 16px)
        lg: 'text-2xl',       // 24px (was 18px)
        xl: 'text-3xl',       // 30px (was 20px)
        '2xl': 'text-4xl',    // 36px (was 24px)
        '3xl': 'text-5xl',    // 48px (was 30px)
      }
    : {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
      };

  const spacing = isElderlyMode
    ? {
        sm: 'p-4',   // was p-2
        md: 'p-6',   // was p-4
        lg: 'p-8',   // was p-6
      }
    : {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      };

  const iconSize = isElderlyMode
    ? {
        sm: 24,  // was 16
        md: 32,  // was 20
        lg: 40,  // was 24
      }
    : {
        sm: 16,
        md: 20,
        lg: 24,
      };

  return (
    <ElderlyModeContext.Provider value={{
      isElderlyMode,
      toggleElderlyMode,
      setElderlyMode,
      fontSize,
      spacing,
      iconSize,
    }}>
      {children}
    </ElderlyModeContext.Provider>
  );
};

export const useElderlyMode = () => {
  const context = useContext(ElderlyModeContext);
  if (context === undefined) {
    throw new Error('useElderlyMode must be used within an ElderlyModeProvider');
  }
  return context;
};
