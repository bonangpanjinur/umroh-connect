import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { manasikSteps, ManasikStep } from '@/data/manasikData';
import { locationsData, Location } from '@/data/locationsData';

// IndexedDB Database name and stores
const DB_NAME = 'arah-umroh-offline';
const DB_VERSION = 1;

interface OfflineStore {
  prayers: 'prayers';
  manasik: 'manasik';
  locations: 'locations';
  audioCache: 'audioCache';
  metadata: 'metadata';
}

const STORES: OfflineStore = {
  prayers: 'prayers',
  manasik: 'manasik',
  locations: 'locations',
  audioCache: 'audioCache',
  metadata: 'metadata',
};

export interface OfflineStatus {
  prayers: {
    downloaded: boolean;
    count: number;
    audioCount: number;
    size: number; // in bytes
    lastSync: string | null;
  };
  manasik: {
    downloaded: boolean;
    count: number;
    size: number;
    lastSync: string | null;
  };
  locations: {
    downloaded: boolean;
    count: number;
    size: number;
    lastSync: string | null;
  };
  totalSize: number;
  isOnline: boolean;
}

interface Prayer {
  id: string;
  title: string;
  title_arabic?: string;
  arabic_text: string;
  transliteration?: string;
  translation?: string;
  audio_url?: string;
  category_id?: string;
  category?: { name: string };
}

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.prayers)) {
        db.createObjectStore(STORES.prayers, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.manasik)) {
        db.createObjectStore(STORES.manasik, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.locations)) {
        db.createObjectStore(STORES.locations, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.audioCache)) {
        db.createObjectStore(STORES.audioCache, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(STORES.metadata)) {
        db.createObjectStore(STORES.metadata, { keyPath: 'key' });
      }
    };
  });
};

// Generic store operations
const saveToStore = async <T extends { id?: string }>(storeName: string, items: T[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    items.forEach(item => store.put(item));
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const getFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getStoreCount = async (storeName: string): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Metadata operations
const saveMetadata = async (key: string, value: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.metadata, 'readwrite');
    const store = transaction.objectStore(STORES.metadata);
    store.put({ key, value, updatedAt: new Date().toISOString() });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const getMetadata = async (key: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.metadata, 'readonly');
    const store = transaction.objectStore(STORES.metadata);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
};

// Estimate size of data
const estimateSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

// Audio caching with fetch
const cacheAudio = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.audioCache, 'readwrite');
      const store = transaction.objectStore(STORES.audioCache);
      store.put({ 
        url, 
        data: arrayBuffer, 
        contentType: blob.type,
        size: blob.size,
        cachedAt: new Date().toISOString() 
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to cache audio:', url, error);
  }
};

const getCachedAudio = async (url: string): Promise<Blob | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.audioCache, 'readonly');
      const store = transaction.objectStore(STORES.audioCache);
      const request = store.get(url);
      
      request.onsuccess = () => {
        if (request.result) {
          const blob = new Blob([request.result.data], { type: request.result.contentType });
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
};

export const useOfflineManager = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    prayers: { downloaded: false, count: 0, audioCount: 0, size: 0, lastSync: null },
    manasik: { downloaded: false, count: 0, size: 0, lastSync: null },
    locations: { downloaded: false, count: 0, size: 0, lastSync: null },
    totalSize: 0,
    isOnline: navigator.onLine,
  });
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    type: string;
  } | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setStatus(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setStatus(s => ({ ...s, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load status on mount
  const refreshStatus = useCallback(async () => {
    try {
      const [prayersCount, manasikCount, locationsCount] = await Promise.all([
        getStoreCount(STORES.prayers),
        getStoreCount(STORES.manasik),
        getStoreCount(STORES.locations),
      ]);
      
      const [prayersSync, manasikSync, locationsSync] = await Promise.all([
        getMetadata('prayers_lastSync'),
        getMetadata('manasik_lastSync'),
        getMetadata('locations_lastSync'),
      ]);
      
      const audioCount = await getStoreCount(STORES.audioCache);
      
      // Estimate sizes
      const prayers = await getFromStore<Prayer>(STORES.prayers);
      const manasik = await getFromStore<ManasikStep>(STORES.manasik);
      const locations = await getFromStore<Location>(STORES.locations);
      
      const prayersSize = estimateSize(prayers);
      const manasikSize = estimateSize(manasik);
      const locationsSize = estimateSize(locations);
      
      setStatus({
        prayers: {
          downloaded: prayersCount > 0,
          count: prayersCount,
          audioCount,
          size: prayersSize,
          lastSync: prayersSync || null,
        },
        manasik: {
          downloaded: manasikCount > 0,
          count: manasikCount,
          size: manasikSize,
          lastSync: manasikSync || null,
        },
        locations: {
          downloaded: locationsCount > 0,
          count: locationsCount,
          size: locationsSize,
          lastSync: locationsSync || null,
        },
        totalSize: prayersSize + manasikSize + locationsSize,
        isOnline: navigator.onLine,
      });
    } catch (error) {
      console.error('Failed to refresh offline status:', error);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Download prayers
  const downloadPrayers = async (includeAudio = true): Promise<void> => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 1, type: 'Doa & Dzikir' });
    
    try {
      // Fetch prayers from Supabase
      const { data, error } = await (supabase as any)
        .from('prayers')
        .select('*, category:prayer_categories(name)')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const prayers = data as Prayer[];
      
      // Save to IndexedDB
      await saveToStore(STORES.prayers, prayers || []);
      await saveMetadata('prayers_lastSync', new Date().toISOString());
      
      // Cache audio files if requested
      if (includeAudio && prayers) {
        const prayersWithAudio = prayers.filter(p => p.audio_url);
        let audioDownloaded = 0;
        
        setDownloadProgress({ 
          current: 0, 
          total: prayersWithAudio.length, 
          type: 'Audio Doa' 
        });
        
        for (const prayer of prayersWithAudio) {
          if (prayer.audio_url) {
            await cacheAudio(prayer.audio_url);
            audioDownloaded++;
            setDownloadProgress({ 
              current: audioDownloaded, 
              total: prayersWithAudio.length, 
              type: 'Audio Doa' 
            });
          }
        }
      }
      
      await refreshStatus();
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Download manasik guide
  const downloadManasik = async (): Promise<void> => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 1, type: 'Panduan Manasik' });
    
    try {
      // Manasik is local data, just save to IndexedDB
      await saveToStore(STORES.manasik, manasikSteps);
      await saveMetadata('manasik_lastSync', new Date().toISOString());
      
      setDownloadProgress({ current: 1, total: 1, type: 'Panduan Manasik' });
      await refreshStatus();
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Download locations
  const downloadLocations = async (): Promise<void> => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 1, type: 'Lokasi Penting' });
    
    try {
      // Locations is local data
      await saveToStore(STORES.locations, locationsData);
      await saveMetadata('locations_lastSync', new Date().toISOString());
      
      setDownloadProgress({ current: 1, total: 1, type: 'Lokasi Penting' });
      await refreshStatus();
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Download all content
  const downloadAll = async (includeAudio = true): Promise<void> => {
    await downloadManasik();
    await downloadLocations();
    await downloadPrayers(includeAudio);
  };

  // Clear specific content
  const clearPrayers = async (): Promise<void> => {
    await clearStore(STORES.prayers);
    await clearStore(STORES.audioCache);
    await refreshStatus();
  };

  const clearManasik = async (): Promise<void> => {
    await clearStore(STORES.manasik);
    await refreshStatus();
  };

  const clearLocations = async (): Promise<void> => {
    await clearStore(STORES.locations);
    await refreshStatus();
  };

  const clearAll = async (): Promise<void> => {
    await Promise.all([
      clearStore(STORES.prayers),
      clearStore(STORES.manasik),
      clearStore(STORES.locations),
      clearStore(STORES.audioCache),
      clearStore(STORES.metadata),
    ]);
    await refreshStatus();
  };

  // Get offline data
  const getOfflinePrayers = async (): Promise<Prayer[]> => {
    return getFromStore<Prayer>(STORES.prayers);
  };

  const getOfflineManasik = async (): Promise<ManasikStep[]> => {
    return getFromStore<ManasikStep>(STORES.manasik);
  };

  const getOfflineLocations = async (): Promise<Location[]> => {
    return getFromStore<Location>(STORES.locations);
  };

  // Get cached audio blob URL
  const getOfflineAudioUrl = async (originalUrl: string): Promise<string | null> => {
    const blob = await getCachedAudio(originalUrl);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  };

  return {
    status,
    isDownloading,
    downloadProgress,
    refreshStatus,
    downloadPrayers,
    downloadManasik,
    downloadLocations,
    downloadAll,
    clearPrayers,
    clearManasik,
    clearLocations,
    clearAll,
    getOfflinePrayers,
    getOfflineManasik,
    getOfflineLocations,
    getOfflineAudioUrl,
  };
};

export default useOfflineManager;
