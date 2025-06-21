import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SimpleMap from "@/components/simple-map";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
  compact?: boolean;
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation,
  height = "280px",
  compact = false 
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const { latitude, longitude, error, loading, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
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
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      return fallbackAddress;
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handle location selection from map
  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    const addressText = await getAddressFromCoordinates(lat, lng);
    onLocationSelect({ lat, lng, address: addressText });
  };

  // Handle GPS button click
  const handleUseCurrentLocation = () => {
    if (latitude && longitude) {
      handleMapLocationSelect(latitude, longitude);
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
      handleMapLocationSelect(latitude, longitude);
    }
  }, [latitude, longitude]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error GPS",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  const mapCenter: [number, number] = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng]
    : (latitude && longitude ? [latitude, longitude] : [-7.3274, 108.2207]); // Tasikmalaya coordinates

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Pilih Lokasi</span>
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
          <SimpleMap
            onLocationSelect={handleLocationSelect}
            center={mapCenter}
            height={height}
            showGpsButton={true}
            interactive={true}
          />
            {/* Road Map Background */}
            <div className="absolute inset-0">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="roads-picker" patternUnits="userSpaceOnUse" width="80" height="80">
                    <rect width="80" height="80" fill="#e5e7eb"/>
                    <rect x="0" y="35" width="80" height="10" fill="#d1d5db"/>
                    <rect x="35" y="0" width="10" height="80" fill="#d1d5db"/>
                    <rect x="0" y="39" width="80" height="2" fill="#9ca3af"/>
                    <rect x="39" y="0" width="2" height="80" fill="#9ca3af"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#f5f5f5"/>
                <rect width="100%" height="100%" fill="url(#roads-picker)" opacity="0.8"/>
                
                <g stroke="#ffffff" strokeWidth="3" fill="none">
                  <line x1="0" y1="30%" x2="100%" y2="30%"/>
                  <line x1="0" y1="70%" x2="100%" y2="70%"/>
                  <line x1="30%" y1="0" x2="30%" y2="100%"/>
                  <line x1="70%" y1="0" x2="70%" y2="100%"/>
                </g>
              </svg>
            </div>

            {/* City boundary */}
            <div className="absolute inset-2 border border-gray-300 rounded bg-white/10">
              <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded shadow-sm text-xs font-medium text-gray-700">
                Klik untuk memilih lokasi
              </div>
            </div>

            {/* Selected location marker */}
            {selectedLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${((selectedLocation.lng + 108.1500) / (108.3000 + 108.1500)) * 100}%`,
                  top: `${((-7.2500 - selectedLocation.lat) / (-7.2500 - (-7.4000))) * 100}%`,
                }}
              >
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                  📍
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow p-2">
              <div className="text-xs text-gray-600">📍 Tasikmalaya</div>
            </div>
          </div>
        </div>

        {/* Address Display */}
        {selectedLocation && (
          <div className="space-y-2">
            <Label htmlFor="selected-address">Alamat yang Dipilih</Label>
            <div className="flex items-center space-x-2">
              {isLoadingAddress ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Mengambil alamat...</span>
                </div>
              ) : (
                <Input
                  id="selected-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat akan muncul di sini..."
                  className="flex-1"
                />
              )}
            </div>
            
            {/* Coordinates */}
            <div className="text-xs text-gray-500">
              Koordinat: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Cara menggunakan:</p>
              <ul className="mt-1 space-y-1 text-blue-700">
                <li>• Klik tombol "Gunakan GPS" untuk lokasi otomatis</li>
                <li>• Atau klik pada peta untuk memilih lokasi manual</li>
                <li>• Drag dan zoom peta untuk navigasi yang lebih baik</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}