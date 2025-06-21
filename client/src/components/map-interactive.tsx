import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapInteractiveProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: string;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
  showGpsButton?: boolean;
  disableInteraction?: boolean;
}

export default function MapInteractive({ 
  center = [-7.3274, 108.2207], // Tasikmalaya coordinates
  zoom = 13,
  height = "280px",
  markers = [],
  onLocationSelect,
  showGpsButton = true,
  disableInteraction = false
}: MapInteractiveProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const { latitude, longitude, error, loading, getCurrentLocation } = useGeolocation();

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Initialize interactive map
    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: zoom,
      zoomControl: !disableInteraction,
      dragging: !disableInteraction,
      touchZoom: !disableInteraction,
      doubleClickZoom: !disableInteraction,
      scrollWheelZoom: false, // Always disable scroll wheel zoom for better UX
      boxZoom: !disableInteraction,
      keyboard: !disableInteraction
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click handler for location selection
    if (onLocationSelect) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        // Remove existing marker
        if (currentMarkerRef.current) {
          map.removeLayer(currentMarkerRef.current);
        }
        
        // Add new marker at clicked location
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup("Lokasi yang dipilih").openPopup();
        currentMarkerRef.current = marker;
        
        onLocationSelect(lat, lng);
      });
    }

    // Add existing markers
    markers.forEach(marker => {
      const leafletMarker = L.marker(marker.position).addTo(map);
      if (marker.popup) {
        leafletMarker.bindPopup(marker.popup);
      }
      currentMarkerRef.current = leafletMarker;
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapCenter[0], mapCenter[1], zoom, onLocationSelect]);

  // Update markers when they change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers except current selection
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== currentMarkerRef.current) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach(marker => {
      const leafletMarker = L.marker(marker.position).addTo(map);
      if (marker.popup) {
        leafletMarker.bindPopup(marker.popup);
      }
    });
  }, [markers]);

  // Handle GPS location update
  useEffect(() => {
    if (latitude && longitude) {
      const newCenter: [number, number] = [latitude, longitude];
      setMapCenter(newCenter);
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(newCenter, zoom);
        
        // Add current location marker
        if (currentMarkerRef.current) {
          mapInstanceRef.current.removeLayer(currentMarkerRef.current);
        }
        
        const currentLocationMarker = L.marker(newCenter).addTo(mapInstanceRef.current);
        currentLocationMarker.bindPopup("Lokasi Anda saat ini").openPopup();
        currentMarkerRef.current = currentLocationMarker;
        
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude);
        }
      }
    }
  }, [latitude, longitude]);

  const handleGpsClick = () => {
    getCurrentLocation();
  };

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border"
      />
      
      {showGpsButton && (
        <div className="absolute top-2 right-2 z-[1000]">
          <Button
            onClick={handleGpsClick}
            size="sm"
            variant="outline"
            className="bg-white shadow-md hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="ml-1 text-xs">
              {loading ? 'Mencari...' : 'GPS'}
            </span>
          </Button>
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000]">
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}