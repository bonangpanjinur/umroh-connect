import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useJamaahAccess } from '@/hooks/useJamaahAccess';
import { useAuthContext } from '@/contexts/AuthContext';

interface FeatureLockProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  onViewPackages?: () => void;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  children,
  featureName,
  description = 'Fitur ini tersedia setelah Anda memesan paket umroh atau haji.',
  onViewPackages,
}) => {
  const { user } = useAuthContext();
  const { hasActiveBooking, isLoading } = useJamaahAccess();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{featureName}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Silakan login untuk mengakses fitur ini.
            </p>
            <Button asChild>
              <a href="/auth">Masuk / Daftar</a>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Logged in but no active booking - show upgrade prompt
  if (!hasActiveBooking) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">🔒 {featureName}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {description}
            </p>
            {onViewPackages && (
              <Button onClick={onViewPackages} className="gap-2">
                Lihat Paket Umroh
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Has active booking - show the feature
  return <>{children}</>;
};

// Higher-order component version
export const withJamaahAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureName: string,
  description?: string
) => {
  return (props: P & { onViewPackages?: () => void }) => {
    return (
      <FeatureLock 
        featureName={featureName} 
        description={description}
        onViewPackages={props.onViewPackages}
      >
        <WrappedComponent {...props} />
      </FeatureLock>
    );
  };
};
