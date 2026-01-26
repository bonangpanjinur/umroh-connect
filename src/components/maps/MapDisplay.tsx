import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, getCategoryColor } from '@/data/locationsData';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapDisplayProps {
  locations: Location[];
  userLocation?: { latitude: number; longitude: number } | null;
  selectedLocation?: Location | null;
  onLocationSelect: (location: Location) => void;
}

// Custom marker icons
const createIcon = (color: string, isUser: boolean = false) => {
  const size = isUser ? 16 : 12;
  const svgIcon = isUser
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size * 2}" height="${size * 2}"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="3"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size * 2}" height="${size * 2}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="white" stroke-width="1"/></svg>`;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size * 2],
    popupAnchor: [0, -size * 2]
  });
};

// Component to handle map center changes
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  
  return null;
};

const MapDisplay = ({ locations, userLocation, selectedLocation, onLocationSelect }: MapDisplayProps) => {
  // Default center: Ka'bah
  const defaultCenter: [number, number] = [21.4225, 39.8262];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(15);

  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.latitude, selectedLocation.longitude]);
      setMapZoom(17);
    } else if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(15);
    }
  }, [selectedLocation, userLocation]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 180px;
        }
      `}</style>
      
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createIcon('#3b82f6', true)}
          >
            <Popup>
              <div className="p-3 text-center">
                <p className="font-semibold text-sm">Lokasi Anda</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Location markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createIcon(getCategoryColor(location.category))}
            eventHandlers={{
              click: () => onLocationSelect(location)
            }}
          >
            <Popup>
              <div className="p-3">
                <h3 className="font-bold text-sm">{location.name}</h3>
                <p className="text-xs text-emerald-600 font-arabic mt-1">{location.nameArabic}</p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{location.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
