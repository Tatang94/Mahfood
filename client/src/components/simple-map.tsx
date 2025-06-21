import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, RotateCcw, Plus, Minus } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';

// Tasikmalaya coordinates
const TASIKMALAYA_CENTER: [number, number] = [-7.3274, 108.2207];

interface SimpleMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: string;
    color?: string;
  }>;
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  showGpsButton?: boolean;
  interactive?: boolean;
  className?: string;
}

export default function SimpleMap({ 
  center = TASIKMALAYA_CENTER,
  zoom = 13,
  height = "320px",
  markers = [],
  onLocationSelect,
  showGpsButton = true,
  interactive = true,
  className = ""
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const { latitude, longitude, error, loading, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();

  // Load Leaflet dynamically
  useEffect(() => {
    let map: any = null;
    
    const loadLeaflet = async () => {
      try {
        // Dynamic import of Leaflet
        const L = await import('leaflet');
        
        // Import CSS
        await import('leaflet/dist/leaflet.css');

        if (!mapRef.current) return;

        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map
        map = L.map(mapRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: false,
          dragging: interactive,
          touchZoom: interactive,
          doubleClickZoom: interactive,
          scrollWheelZoom: false,
          boxZoom: interactive,
          keyboard: interactive
        });

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5Ij5NYXAgVGlsZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=='
        });

        tileLayer.on('tileerror', (e: any) => {
          console.warn('Tile load error:', e);
        });

        tileLayer.on('tileload', () => {
          setMapLoaded(true);
        });

        tileLayer.addTo(map);

        // Add click handler for location selection
        if (onLocationSelect && interactive) {
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            setSelectedLocation([lat, lng]);
            onLocationSelect(lat, lng);
          });
        }

        // Add existing markers
        markers.forEach(marker => {
          let markerIcon;
          if (marker.icon) {
            markerIcon = L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background: ${marker.color || '#3b82f6'};
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
                  ${marker.icon}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
          }

          const leafletMarker = L.marker(marker.position, markerIcon ? { icon: markerIcon } : {})
            .addTo(map);
          
          if (marker.popup) {
            leafletMarker.bindPopup(marker.popup);
          }
        });

        setMapLoaded(true);
      } catch (err) {
        console.error('Error loading map:', err);
        setMapError('Gagal memuat peta. Coba refresh halaman.');
      }
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [center, zoom, markers, interactive, onLocationSelect]);

  // Handle GPS location
  useEffect(() => {
    if (latitude && longitude && mapLoaded) {
      const loadLeaflet = async () => {
        try {
          const L = await import('leaflet');
          if (mapRef.current) {
            // Get map instance
            const mapInstance = (mapRef.current as any)._leaflet_map;
            if (mapInstance) {
              const newCenter: [number, number] = [latitude, longitude];
              mapInstance.setView(newCenter, Math.max(zoom || 13, 15));
              
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
              }).addTo(mapInstance);
              
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
        } catch (err) {
          console.error('Error handling GPS location:', err);
        }
      };
      
      loadLeaflet();
    }
  }, [latitude, longitude, mapLoaded]);

  const handleGpsClick = () => {
    getCurrentLocation();
  };

  if (mapError) {
    return (
      <div className={`${className} border rounded-lg overflow-hidden`} style={{ height }}>
        <div className="h-full flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-gray-600">{mapError}</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border shadow-sm bg-gray-100"
      />
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Memuat peta...</p>
          </div>
        </div>
      )}
      
      {/* Control buttons */}
      {mapLoaded && (
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
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute bottom-2 left-2 z-[1000]">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Mencari lokasi...
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