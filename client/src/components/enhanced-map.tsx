import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, RotateCcw, Plus, Minus } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tasikmalaya coordinates and bounds
const TASIKMALAYA_CENTER: [number, number] = [-7.3274, 108.2207];
const TASIKMALAYA_BOUNDS: L.LatLngBoundsExpression = [
  [-7.4000, 108.1500], // Southwest
  [-7.2500, 108.3000]  // Northeast
];

interface MarkerData {
  position: [number, number];
  popup?: string;
  icon?: string;
  color?: string;
}

interface EnhancedMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  markers?: MarkerData[];
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  showGpsButton?: boolean;
  showZoomControls?: boolean;
  interactive?: boolean;
  className?: string;
}

export default function EnhancedMap({ 
  center = TASIKMALAYA_CENTER,
  zoom = 13,
  height = "320px",
  markers = [],
  onLocationSelect,
  showGpsButton = true,
  showZoomControls = true,
  interactive = true,
  className = ""
}: EnhancedMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  
  const { latitude, longitude, error, loading, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: currentZoom,
      zoomControl: false, // We'll add custom controls
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: false, // Better UX - prevent accidental zoom
      boxZoom: interactive,
      keyboard: interactive,
      maxBounds: TASIKMALAYA_BOUNDS,
      maxBoundsViscosity: 0.8
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Create markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Handle map click for location selection
    if (onLocationSelect && interactive) {
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // Remove existing selected marker
        if (selectedMarkerRef.current) {
          map.removeLayer(selectedMarkerRef.current);
        }
        
        // Add new marker at clicked location
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'selected-location-marker',
            html: `
              <div style="
                background: #ef4444;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                color: white;
                font-size: 12px;
              ">
                📍
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);
        
        selectedMarkerRef.current = marker;
        
        // Get address for the location
        try {
          setIsLoadingAddress(true);
          const address = await getAddressFromCoordinates(lat, lng);
          marker.bindPopup(`
            <div class="text-sm">
              <strong>Lokasi Dipilih</strong><br/>
              ${address}
            </div>
          `).openPopup();
          
          onLocationSelect(lat, lng, address);
        } catch (error) {
          marker.bindPopup("Lokasi yang dipilih").openPopup();
          onLocationSelect(lat, lng);
        } finally {
          setIsLoadingAddress(false);
        }
      });
    }

    // Handle zoom changes
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      selectedMarkerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    // Add new markers
    markers.forEach((markerData, index) => {
      const { position, popup, icon, color } = markerData;
      
      let markerIcon;
      if (icon) {
        markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: ${color || '#3b82f6'};
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              font-size: 16px;
            ">
              ${icon}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
      }

      const marker = L.marker(position, markerIcon ? { icon: markerIcon } : {})
        .addTo(markersLayer);
      
      if (popup) {
        marker.bindPopup(popup);
      }
    });
  }, [markers]);

  // Handle GPS location update
  useEffect(() => {
    if (latitude && longitude) {
      const newCenter: [number, number] = [latitude, longitude];
      setMapCenter(newCenter);
      
      const map = mapInstanceRef.current;
      if (map) {
        map.setView(newCenter, Math.max(currentZoom, 15));
        
        // Remove existing selected marker
        if (selectedMarkerRef.current) {
          map.removeLayer(selectedMarkerRef.current);
        }
        
        // Add current location marker
        const currentLocationMarker = L.marker(newCenter, {
          icon: L.divIcon({
            className: 'current-location-marker',
            html: `
              <div style="
                background: #10b981;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              ">
                📍
              </div>
              <style>
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
              </style>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        }).addTo(map);
        
        selectedMarkerRef.current = currentLocationMarker;
        
        currentLocationMarker.bindPopup("📍 Lokasi Anda saat ini").openPopup();
        
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude, "Lokasi saya saat ini");
        }
        
        toast({
          title: "Lokasi ditemukan",
          description: "Lokasi Anda berhasil ditentukan",
        });
      }
    }
  }, [latitude, longitude]);

  // Get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      throw new Error('Gagal mendapatkan alamat');
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleGpsClick = () => {
    getCurrentLocation();
  };

  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.zoomOut();
    }
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView(TASIKMALAYA_CENTER, 13);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border shadow-sm"
      />
      
      {/* Control buttons */}
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
        {showGpsButton && (
          <Button
            onClick={handleGpsClick}
            size="sm"
            variant="outline"
            className="bg-white shadow-md hover:bg-gray-50 p-2"
            disabled={loading}
            title="Dapatkan lokasi saya"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </Button>
        )}
        
        {showZoomControls && (
          <>
            <Button
              onClick={handleZoomIn}
              size="sm"
              variant="outline"
              className="bg-white shadow-md hover:bg-gray-50 p-2"
              title="Perbesar"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleZoomOut}
              size="sm"
              variant="outline"
              className="bg-white shadow-md hover:bg-gray-50 p-2"
              title="Perkecil"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleResetView}
              size="sm"
              variant="outline"
              className="bg-white shadow-md hover:bg-gray-50 p-2"
              title="Reset tampilan"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      
      {/* Loading indicator */}
      {(loading || isLoadingAddress) && (
        <div className="absolute bottom-2 left-2 z-[1000]">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {loading ? 'Mencari lokasi...' : 'Mendapatkan alamat...'}
          </div>
        </div>
      )}
      
      {/* Error display */}
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