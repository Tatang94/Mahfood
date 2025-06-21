import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";

// Tasikmalaya boundaries
const TASIKMALAYA_BOUNDS = {
  north: -7.2500,
  south: -7.4000,
  east: 108.3000,
  west: 108.1500
};

const TASIKMALAYA_CENTER = { lat: -7.3274, lng: 108.2207 };

interface RealisticLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
  compact?: boolean;
}

export default function RealisticLocationPicker({ 
  onLocationSelect, 
  initialLocation,
  height = "280px",
  compact = false 
}: RealisticLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const { latitude, longitude, error, loading, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);

  // Reverse geocoding using Nominatim
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(formattedAddress);
        return formattedAddress;
      } else {
        throw new Error('Gagal mendapatkan alamat');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      return fallbackAddress;
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handle map click
  const handleMapClick = async (event: MouseEvent) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width);
    const y = ((event.clientY - rect.top) / rect.height);
    
    // Convert click position to coordinates
    const lng = TASIKMALAYA_BOUNDS.west + (x * (TASIKMALAYA_BOUNDS.east - TASIKMALAYA_BOUNDS.west));
    const lat = TASIKMALAYA_BOUNDS.north - (y * (TASIKMALAYA_BOUNDS.north - TASIKMALAYA_BOUNDS.south));
    
    // Ensure coordinates are within Tasikmalaya bounds
    if (lat >= TASIKMALAYA_BOUNDS.south && lat <= TASIKMALAYA_BOUNDS.north &&
        lng >= TASIKMALAYA_BOUNDS.west && lng <= TASIKMALAYA_BOUNDS.east) {
      
      setSelectedLocation({ lat, lng });
      const addressText = await getAddressFromCoordinates(lat, lng);
      onLocationSelect({ lat, lng, address: addressText });
    }
  };

  const handleUseCurrentLocation = () => {
    if (latitude && longitude) {
      setSelectedLocation({ lat: latitude, lng: longitude });
      getAddressFromCoordinates(latitude, longitude).then(addressText => {
        onLocationSelect({ lat: latitude, lng: longitude, address: addressText });
      });
    } else {
      getCurrentLocation();
      toast({
        title: "Mengambil Lokasi GPS",
        description: "Sedang mencari lokasi Anda...",
      });
    }
  };

  // Auto-select GPS location when available
  useEffect(() => {
    if (latitude && longitude && !selectedLocation) {
      setSelectedLocation({ lat: latitude, lng: longitude });
      getAddressFromCoordinates(latitude, longitude).then(addressText => {
        onLocationSelect({ lat: latitude, lng: longitude, address: addressText });
      });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error GPS",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create OpenStreetMap iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${TASIKMALAYA_BOUNDS.west}%2C${TASIKMALAYA_BOUNDS.south}%2C${TASIKMALAYA_BOUNDS.east}%2C${TASIKMALAYA_BOUNDS.north}&layer=mapnik`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    mapRef.current.innerHTML = '';
    mapRef.current.appendChild(iframe);

    // Add click event listener to the container
    const clickHandler = (e: MouseEvent) => handleMapClick(e);
    mapRef.current.addEventListener('click', clickHandler);

    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener('click', clickHandler);
        mapRef.current.innerHTML = '';
      }
    };
  }, []);

  const coordToPosition = (lat: number, lng: number) => {
    const x = ((lng - TASIKMALAYA_BOUNDS.west) / (TASIKMALAYA_BOUNDS.east - TASIKMALAYA_BOUNDS.west)) * 100;
    const y = ((TASIKMALAYA_BOUNDS.north - lat) / (TASIKMALAYA_BOUNDS.north - TASIKMALAYA_BOUNDS.south)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Pilih Lokasi di Tasikmalaya</span>
          </div>
          <Button
            onClick={handleUseCurrentLocation}
            size="sm"
            variant="outline"
            disabled={loading}
            className="flex items-center space-x-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{loading ? "Mencari..." : "Gunakan GPS"}</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div className="relative">
          <div 
            ref={mapRef}
            style={{ height, width: '100%' }} 
            className="rounded-lg overflow-hidden bg-gray-100 cursor-crosshair"
          />
          
          {/* Selected location marker overlay */}
          {selectedLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{
                left: `${coordToPosition(selectedLocation.lat, selectedLocation.lng).x}%`,
                top: `${coordToPosition(selectedLocation.lat, selectedLocation.lng).y}%`,
              }}
            >
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                📍
              </div>
            </div>
          )}
        </div>

        {/* Address Display */}
        {selectedLocation && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Lokasi yang dipilih:</h4>
            {isLoadingAddress ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Mencari alamat...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{address}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-600">
          <p>📍 Klik pada peta untuk memilih lokasi pengiriman di Tasikmalaya</p>
          <p>🗺️ Peta menampilkan nama jalan dan bangunan asli</p>
        </div>
      </CardContent>
    </Card>
  );
}