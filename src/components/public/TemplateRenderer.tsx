
import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load themes for better performance
const DefaultTheme = lazy(() => import('@/templates/DefaultTheme'));
const GoldLuxuryTheme = lazy(() => import('@/templates/GoldLuxuryTheme'));

interface TemplateRendererProps {
  templateSlug: string | null;
  data: {
    settings: any;
    travel: any;
    packages: any[];
  };
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ templateSlug, data }) => {
  const renderTemplate = () => {
    switch (templateSlug) {
      case 'gold-luxury':
        return <GoldLuxuryTheme data={data} />;
      case 'default':
      default:
        return <DefaultTheme data={data} />;
    }
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Menyiapkan tampilan...</p>
        </div>
      </div>
    }>
      {renderTemplate()}
    </Suspense>
  );
};

export default TemplateRenderer;
