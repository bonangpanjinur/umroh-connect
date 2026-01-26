import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    error: null
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000
  } = options;

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      loading: false,
      error: null
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Gagal mendapatkan lokasi';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Izin lokasi ditolak. Aktifkan GPS untuk fitur ini.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Informasi lokasi tidak tersedia.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Permintaan lokasi timeout.';
        break;
    }

    setState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation tidak didukung browser ini.'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, handleError]);

  useEffect(() => {
    requestLocation();
  }, []);

  return {
    ...state,
    requestLocation
  };
};
