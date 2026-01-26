import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { manasikSteps, ManasikStep } from '@/data/manasikData';
import { locationsData, Location } from '@/data/locationsData';

// IndexedDB Database name and stores
const DB_NAME = 'arah-umroh-offline';
const DB_VERSION = 2; // Upgraded for map tiles

interface OfflineStore {
  prayers: 'prayers';
  manasik: 'manasik';
  locations: 'locations';
  audioCache: 'audioCache';
  mapTiles: 'mapTiles';
  metadata: 'metadata';
}

const STORES: OfflineStore = {
  prayers: 'prayers',
  manasik: 'manasik',
  locations: 'locations',
  audioCache: 'audioCache',
  mapTiles: 'mapTiles',
  metadata: 'metadata',
};

// Map tile regions for Makkah and Madinah
export const MAP_REGIONS = {
  makkah: {
    name: 'Makkah',
    center: { lat: 21.4225, lng: 39.8262 },
    bounds: {
      minLat: 21.35,
      maxLat: 21.50,
      minLng: 39.75,
      maxLng: 39.95,
    },
  },
  madinah: {
    name: 'Madinah',
    center: { lat: 24.4672, lng: 39.6024 },
    bounds: {
      minLat: 24.40,
      maxLat: 24.55,
      minLng: 39.55,
      maxLng: 39.70,
    },
  },
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
  mapTiles: {
    downloaded: boolean;
    count: number;
    size: number;
    lastSync: string | null;
    regions: string[];
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
      if (!db.objectStoreNames.contains(STORES.mapTiles)) {
        db.createObjectStore(STORES.mapTiles, { keyPath: 'key' });
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
    mapTiles: { downloaded: false, count: 0, size: 0, lastSync: null, regions: [] },
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
      const [prayersCount, manasikCount, locationsCount, mapTilesCount] = await Promise.all([
        getStoreCount(STORES.prayers),
        getStoreCount(STORES.manasik),
        getStoreCount(STORES.locations),
        getStoreCount(STORES.mapTiles),
      ]);
      
      const [prayersSync, manasikSync, locationsSync, mapTilesSync, downloadedRegions] = await Promise.all([
        getMetadata('prayers_lastSync'),
        getMetadata('manasik_lastSync'),
        getMetadata('locations_lastSync'),
        getMetadata('mapTiles_lastSync'),
        getMetadata('mapTiles_regions'),
      ]);
      
      const audioCount = await getStoreCount(STORES.audioCache);
      
      // Estimate sizes
      const prayers = await getFromStore<Prayer>(STORES.prayers);
      const manasik = await getFromStore<ManasikStep>(STORES.manasik);
      const locations = await getFromStore<Location>(STORES.locations);
      const mapTiles = await getFromStore<{key: string; size: number}>(STORES.mapTiles);
      
      const prayersSize = estimateSize(prayers);
      const manasikSize = estimateSize(manasik);
      const locationsSize = estimateSize(locations);
      const mapTilesSize = mapTiles.reduce((acc, tile) => acc + (tile.size || 0), 0);
      
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
        mapTiles: {
          downloaded: mapTilesCount > 0,
          count: mapTilesCount,
          size: mapTilesSize,
          lastSync: mapTilesSync || null,
          regions: downloadedRegions || [],
        },
        totalSize: prayersSize + manasikSize + locationsSize + mapTilesSize,
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

  const clearMapTiles = async (): Promise<void> => {
    await clearStore(STORES.mapTiles);
    await saveMetadata('mapTiles_regions', []);
    await refreshStatus();
  };

  const clearAll = async (): Promise<void> => {
    await Promise.all([
      clearStore(STORES.prayers),
      clearStore(STORES.manasik),
      clearStore(STORES.locations),
      clearStore(STORES.mapTiles),
      clearStore(STORES.audioCache),
      clearStore(STORES.metadata),
    ]);
    await refreshStatus();
  };

  // Download map tiles for a specific region
  const downloadMapTiles = async (regionKey: 'makkah' | 'madinah'): Promise<void> => {
    setIsDownloading(true);
    const region = MAP_REGIONS[regionKey];
    
    try {
      const { minLat, maxLat, minLng, maxLng } = region.bounds;
      const zoomLevels = [14, 15, 16]; // Download tiles at these zoom levels
      const tileUrls: { key: string; url: string }[] = [];
      
      // Calculate tile coordinates for each zoom level
      for (const zoom of zoomLevels) {
        const minTileX = Math.floor((minLng + 180) / 360 * Math.pow(2, zoom));
        const maxTileX = Math.floor((maxLng + 180) / 360 * Math.pow(2, zoom));
        const minTileY = Math.floor((1 - Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        const maxTileY = Math.floor((1 - Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        
        for (let x = minTileX; x <= maxTileX; x++) {
          for (let y = minTileY; y <= maxTileY; y++) {
            const key = `${zoom}/${x}/${y}`;
            const url = `https://tile.openstreetmap.org/${key}.png`;
            tileUrls.push({ key: `${regionKey}_${key}`, url });
          }
        }
      }
      
      setDownloadProgress({ 
        current: 0, 
        total: tileUrls.length, 
        type: `Peta ${region.name}` 
      });
      
      let downloaded = 0;
      const db = await openDB();
      
      for (const { key, url } of tileUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            
            await new Promise<void>((resolve, reject) => {
              const transaction = db.transaction(STORES.mapTiles, 'readwrite');
              const store = transaction.objectStore(STORES.mapTiles);
              store.put({ 
                key, 
                data: arrayBuffer, 
                contentType: blob.type,
                size: blob.size,
                region: regionKey,
                cachedAt: new Date().toISOString() 
              });
              transaction.oncomplete = () => resolve();
              transaction.onerror = () => reject(transaction.error);
            });
          }
        } catch (e) {
          console.warn('Failed to cache tile:', key, e);
        }
        
        downloaded++;
        setDownloadProgress({ 
          current: downloaded, 
          total: tileUrls.length, 
          type: `Peta ${region.name}` 
        });
      }
      
      // Update metadata with downloaded regions
      const existingRegions = (await getMetadata('mapTiles_regions')) || [];
      const newRegions = [...new Set([...existingRegions, regionKey])];
      await saveMetadata('mapTiles_regions', newRegions);
      await saveMetadata('mapTiles_lastSync', new Date().toISOString());
      
      await refreshStatus();
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Download all map regions
  const downloadAllMapTiles = async (): Promise<void> => {
    await downloadMapTiles('makkah');
    await downloadMapTiles('madinah');
  };

  // Get cached map tile
  const getCachedMapTile = async (zoom: number, x: number, y: number): Promise<Blob | null> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.mapTiles, 'readonly');
        const store = transaction.objectStore(STORES.mapTiles);
        
        // Try both region keys
        for (const region of ['makkah', 'madinah']) {
          const key = `${region}_${zoom}/${x}/${y}`;
          const request = store.get(key);
          
          request.onsuccess = () => {
            if (request.result) {
              const blob = new Blob([request.result.data], { type: request.result.contentType });
              resolve(blob);
              return;
            }
          };
        }
        
        // If not found in any region
        resolve(null);
      });
    } catch {
      return null;
    }
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
    downloadMapTiles,
    downloadAllMapTiles,
    downloadAll,
    clearPrayers,
    clearManasik,
    clearLocations,
    clearMapTiles,
    clearAll,
    getOfflinePrayers,
    getOfflineManasik,
    getOfflineLocations,
    getOfflineAudioUrl,
    getCachedMapTile,
    MAP_REGIONS,
  };
};

export default useOfflineManager;
