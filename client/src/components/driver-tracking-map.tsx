import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Batas kota Tasikmalaya
const TASIKMALAYA_BOUNDS = [
  [-7.4000, 108.1500], // Southwest
  [-7.2500, 108.3000]  // Northeast
];

const TASIKMALAYA_CENTER: [number, number] = [-7.3274, 108.2207];

// Create restaurant icon
const createRestaurantIcon = () => {
  return L.divIcon({
    className: 'restaurant-icon',
    html: `
      <div style="
        background: #f59e0b;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.4);
        font-size: 18px;
      ">
        🏪
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 17]
  });
};

// Ikon motor Gojek untuk driver
const createDriverIcon = (driverName: string, isOnline: boolean) => {
  const color = isOnline ? '#00AA13' : '#6B7280';
  const pulse = isOnline ? 'animation: pulse 2s infinite;' : '';
  
  return L.divIcon({
    className: 'driver-icon',
    html: `
      <div style="
        background: ${color};
        border-radius: 50%;
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.4);
        font-size: 20px;
        ${pulse}
        position: relative;
      ">
        🚴
        ${isOnline ? `
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #10B981;
          border: 2px solid white;
          border-radius: 50%;
        "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 3px 12px rgba(0,0,0,0.4); }
          50% { transform: scale(1.1); box-shadow: 0 3px 16px rgba(0,170,19,0.6); }
          100% { transform: scale(1); box-shadow: 0 3px 12px rgba(0,0,0,0.4); }
        }
      </style>
    `,
    iconSize: [45, 45],
    iconAnchor: [22.5, 22.5],
  });
};

interface Driver {
  id: number;
  name: string;
  location: [number, number];
  isOnline: boolean;
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
}

interface DriverTrackingMapProps {
  height?: string;
  showDriverList?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function DriverTrackingMap({ 
  height = "500px",
  showDriverList = true,
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}: DriverTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Fetch drivers data
  const { data: drivers = [], isLoading, refetch } = useQuery<Driver[]>({
    queryKey: ["/api/drivers/tracking"],
    queryFn: async () => {
      // Mock data untuk testing - nanti bisa diganti dengan API real
      return [
        {
          id: 1,
          name: "Budi Santoso",
          location: [-7.3274, 108.2207] as [number, number],
          isOnline: true,
          vehicleNumber: "B 1234 ABC",
          rating: 4.8,
          totalDeliveries: 245
        },
        {
          id: 2,
          name: "Ahmad Rizki",
          location: [-7.3184, 108.2157] as [number, number],
          isOnline: true,
          vehicleNumber: "B 5678 DEF",
          rating: 4.9,
          totalDeliveries: 312
        },
        {
          id: 3,
          name: "Dedi Kurniawan",
          location: [-7.3364, 108.2257] as [number, number],
          isOnline: false,
          vehicleNumber: "B 9012 GHI",
          rating: 4.7,
          totalDeliveries: 198
        },
        {
          id: 4,
          name: "Wahyu Pratama",
          location: [-7.3174, 108.2307] as [number, number],
          isOnline: true,
          vehicleNumber: "B 3456 JKL",
          rating: 4.6,
          totalDeliveries: 167
        }
      ];
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: TASIKMALAYA_CENTER,
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: TASIKMALAYA_BOUNDS,
      maxBoundsViscosity: 1.0,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      crossOrigin: true
    }).addTo(map);

    // Add city boundary
    L.rectangle(TASIKMALAYA_BOUNDS, {
      color: '#00AA13',
      weight: 2,
      opacity: 0.6,
      fillColor: '#00AA13',
      fillOpacity: 0.05
    }).addTo(map);

    // Prevent panning outside bounds
    map.on('drag', () => {
      map.panInsideBounds(TASIKMALAYA_BOUNDS, { animate: false });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Update driver markers
  useEffect(() => {
    if (!mapInstanceRef.current || !drivers.length) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    driverMarkersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    driverMarkersRef.current.clear();

    // Add driver markers
    drivers.forEach(driver => {
      if (driver.location[0] >= TASIKMALAYA_BOUNDS[0][0] && 
          driver.location[0] <= TASIKMALAYA_BOUNDS[1][0] &&
          driver.location[1] >= TASIKMALAYA_BOUNDS[0][1] && 
          driver.location[1] <= TASIKMALAYA_BOUNDS[1][1]) {
        
        const marker = L.marker(driver.location, {
          icon: createDriverIcon(driver.name, driver.isOnline)
        }).addTo(map);

        const statusColor = driver.isOnline ? '#00AA13' : '#6B7280';
        const statusText = driver.isOnline ? 'Online' : 'Offline';

        marker.bindPopup(`
          <div style="text-align: center; padding: 12px; min-width: 200px;">
            <div style="margin-bottom: 8px;">
              <strong style="font-size: 16px;">🏍️ ${driver.name}</strong>
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: ${statusColor}; font-weight: bold;">● ${statusText}</span>
            </div>
            <div style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">
              ${driver.vehicleNumber}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151;">
              <span>⭐ ${driver.rating}</span>
              <span>📦 ${driver.totalDeliveries} trips</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedDriver(driver);
        });

        driverMarkersRef.current.set(driver.id, marker);
      }
    });
  }, [drivers]);

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(driver.location, 16);
      
      const marker = driverMarkersRef.current.get(driver.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const onlineDrivers = drivers.filter(d => d.isOnline);
  const offlineDrivers = drivers.filter(d => !d.isOnline);

  return (
    <div className="space-y-4">
      {/* Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="w-5 h-5" />
              <span>Tracking Driver Real-time - Tasikmalaya</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600">
                {onlineDrivers.length} Online
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef} 
            style={{ height, width: '100%' }} 
            className="rounded-lg border border-gray-200 overflow-hidden"
          />
        </CardContent>
      </Card>

      {/* Driver List */}
      {showDriverList && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Online Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                🟢 Driver Online ({onlineDrivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineDrivers.map(driver => (
                <div 
                  key={driver.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDriver?.id === driver.id ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleDriverSelect(driver)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">🏍️ {driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">⭐ {driver.rating}</p>
                      <p className="text-xs text-gray-500">{driver.totalDeliveries} trips</p>
                    </div>
                  </div>
                </div>
              ))}
              {onlineDrivers.length === 0 && (
                <p className="text-center text-gray-500 py-4">Tidak ada driver online</p>
              )}
            </CardContent>
          </Card>

          {/* Offline Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-600">
                ⚫ Driver Offline ({offlineDrivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {offlineDrivers.map(driver => (
                <div 
                  key={driver.id}
                  className="p-3 border rounded-lg opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">🏍️ {driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">⭐ {driver.rating}</p>
                      <p className="text-xs text-gray-500">{driver.totalDeliveries} trips</p>
                    </div>
                  </div>
                </div>
              ))}
              {offlineDrivers.length === 0 && (
                <p className="text-center text-gray-500 py-4">Semua driver sedang online</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}