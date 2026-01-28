import { useState, useEffect } from 'react';

interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
  windSpeed: number;
}

interface UseWeatherResult {
  makkahWeather: WeatherData | null;
  madinahWeather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Makkah coordinates: 21.4225, 39.8262
// Madinah coordinates: 24.5247, 39.5692

const MAKKAH_COORDS = { lat: 21.4225, lon: 39.8262 };
const MADINAH_COORDS = { lat: 24.5247, lon: 39.5692 };

// Map WMO weather codes to conditions and icons
const getWeatherCondition = (code: number): { condition: string; icon: string } => {
  if (code === 0) return { condition: 'Cerah', icon: '☀️' };
  if (code === 1) return { condition: 'Cerah Berawan', icon: '🌤️' };
  if (code === 2) return { condition: 'Berawan Sebagian', icon: '⛅' };
  if (code === 3) return { condition: 'Berawan', icon: '☁️' };
  if (code >= 45 && code <= 48) return { condition: 'Berkabut', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { condition: 'Gerimis', icon: '🌧️' };
  if (code >= 56 && code <= 57) return { condition: 'Gerimis Beku', icon: '🌧️' };
  if (code >= 61 && code <= 65) return { condition: 'Hujan', icon: '🌧️' };
  if (code >= 66 && code <= 67) return { condition: 'Hujan Beku', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Salju', icon: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Hujan Lebat', icon: '⛈️' };
  if (code >= 85 && code <= 86) return { condition: 'Hujan Salju', icon: '🌨️' };
  if (code >= 95 && code <= 99) return { condition: 'Badai Petir', icon: '⛈️' };
  return { condition: 'Tidak Diketahui', icon: '🌡️' };
};

const fetchWeatherForCity = async (
  lat: number, 
  lon: number, 
  cityName: string
): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia/Riyadh`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch weather for ${cityName}`);
  }
  
  const data = await response.json();
  const current = data.current;
  const { condition, icon } = getWeatherCondition(current.weather_code);
  
  return {
    city: cityName,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    condition,
    icon,
    windSpeed: Math.round(current.wind_speed_10m),
  };
};

export const useWeather = (): UseWeatherResult => {
  const [makkahWeather, setMakkahWeather] = useState<WeatherData | null>(null);
  const [madinahWeather, setMadinahWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [makkah, madinah] = await Promise.all([
        fetchWeatherForCity(MAKKAH_COORDS.lat, MAKKAH_COORDS.lon, 'Makkah'),
        fetchWeatherForCity(MADINAH_COORDS.lat, MADINAH_COORDS.lon, 'Madinah'),
      ]);
      
      setMakkahWeather(makkah);
      setMadinahWeather(madinah);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data cuaca');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    makkahWeather,
    madinahWeather,
    isLoading,
    error,
    refetch: fetchWeather,
  };
};
