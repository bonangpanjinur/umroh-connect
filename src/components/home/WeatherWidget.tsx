import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather } from '@/hooks/useWeather';
import { RefreshCw, Droplets, Wind, ThermometerSun } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WeatherCardProps {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
  windSpeed: number;
  variant: 'makkah' | 'madinah';
}

const WeatherCard = ({
  city,
  temperature,
  feelsLike,
  humidity,
  condition,
  icon,
  windSpeed,
  variant,
}: WeatherCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex-1 rounded-xl p-3 relative overflow-hidden",
        variant === 'makkah' 
          ? "bg-gradient-to-br from-primary/20 to-primary/5" 
          : "bg-gradient-to-br from-accent/30 to-accent/10"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 text-6xl opacity-20 -mr-2 -mt-2">
        {icon}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-sm">{city}</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{temperature}°</span>
          <span className="text-sm text-muted-foreground">C</span>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">{condition}</p>
        
        <div className="flex gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThermometerSun className="w-3 h-3" />
            <span>{feelsLike}°</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            <span>{humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>{windSpeed} km/h</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const WeatherSkeleton = () => (
  <div className="flex-1 rounded-xl p-3 bg-muted/50">
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="w-16 h-4" />
    </div>
    <Skeleton className="w-20 h-8 mb-1" />
    <Skeleton className="w-24 h-3 mb-2" />
    <div className="flex gap-3">
      <Skeleton className="w-12 h-3" />
      <Skeleton className="w-12 h-3" />
      <Skeleton className="w-12 h-3" />
    </div>
  </div>
);

const WeatherWidget = () => {
  const { makkahWeather, madinahWeather, isLoading, error, refetch } = useWeather();

  return (
    <div className="px-4">
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              🌤️ Cuaca Tanah Suci
            </h3>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Refresh cuaca"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          </div>

          {error ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <p>⚠️ {error}</p>
              <button
                onClick={refetch}
                className="mt-2 text-primary hover:underline"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {isLoading || !makkahWeather ? (
                <WeatherSkeleton />
              ) : (
                <WeatherCard {...makkahWeather} variant="makkah" />
              )}
              
              {isLoading || !madinahWeather ? (
                <WeatherSkeleton />
              ) : (
                <WeatherCard {...madinahWeather} variant="madinah" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherWidget;
