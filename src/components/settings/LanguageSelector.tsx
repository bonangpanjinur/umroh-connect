import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
  variant?: 'button' | 'list';
}

export const LanguageSelector = ({ variant = 'button' }: LanguageSelectorProps) => {
  const { language, setLanguage, isRTL } = useLanguage();

  const currentLang = languages.find((l) => l.code === language);

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
              language === lang.code
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <span className="text-2xl">{lang.flag}</span>
              <div className={cn("text-left", isRTL && "text-right")}>
                <p className="font-medium">{lang.nativeName}</p>
                <p className="text-xs text-muted-foreground">{lang.name}</p>
              </div>
            </div>
            {language === lang.code && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.nativeName}</span>
          <span className="sm:hidden">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center justify-between",
              isRTL && "flex-row-reverse"
            )}
          >
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </div>
            {language === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
