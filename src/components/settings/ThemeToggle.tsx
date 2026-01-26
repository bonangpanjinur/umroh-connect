import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  compact?: boolean;
}

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { id: 'light' as const, label: 'Terang', icon: Sun },
    { id: 'dark' as const, label: 'Gelap', icon: Moon },
    { id: 'system' as const, label: 'Sistem', icon: Monitor },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'p-2 rounded-md transition-all relative',
                isActive 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={t.label}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-indicator-compact"
                  className="absolute inset-0 bg-background rounded-md shadow-sm"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {resolvedTheme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            <div>
              <p className="font-medium">Tema Tampilan</p>
              <p className="text-sm text-muted-foreground">
                Pilih tema terang, gelap, atau ikuti sistem
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all relative',
                  isActive 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="theme-indicator"
                    className="absolute inset-0 bg-background rounded-md shadow-sm"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="text-sm font-medium relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeToggle;
