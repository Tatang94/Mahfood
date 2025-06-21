import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin, Navigation } from "lucide-react";

// Tasikmalaya real coordinates
const TASIKMALAYA_CENTER = { lat: -7.3274, lng: 108.2207 };
const TASIKMALAYA_BOUNDS = {
  north: -7.2500,
  south: -7.4000,
  east: 108.3000,
  west: 108.1500
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

interface RealisticTasikmalayaMapProps {
  height?: string;
  showDriverList?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function RealisticTasikmalayaMap({ 
  height = "500px",
  showDriverList = true,
  autoRefresh = true,
  refreshInterval = 10000
}: RealisticTasikmalayaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [drivers] = useState<Driver[]>([
    {
      id: 1,
      name: "Budi Santoso",
      location: [-7.3274, 108.2207], // Alun-alun Tasikmalaya
      isOnline: true,
      vehicleNumber: "B 1234 ABC",
      rating: 4.8,
      totalDeliveries: 245
    },
    {
      id: 2,
      name: "Ahmad Rizki", 
      location: [-7.3184, 108.2157], // Jl. Asia Afrika
      isOnline: true,
      vehicleNumber: "B 5678 DEF",
      rating: 4.9,
      totalDeliveries: 312
    },
    {
      id: 3,
      name: "Dedi Kurniawan",
      location: [-7.3364, 108.2257], // Jl. Sutisna Senjaya
      isOnline: false,
      vehicleNumber: "B 9012 GHI", 
      rating: 4.7,
      totalDeliveries: 198
    },
    {
      id: 4,
      name: "Wahyu Pratama",
      location: [-7.3174, 108.2307], // Jl. Dadaha
      isOnline: true,
      vehicleNumber: "B 3456 JKL",
      rating: 4.6,
      totalDeliveries: 167
    }
  ]);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [driverPositions, setDriverPositions] = useState<{[key: number]: {x: number, y: number, direction: number}}>({});

  const onlineDrivers = drivers.filter(d => d.isOnline);
  const offlineDrivers = drivers.filter(d => !d.isOnline);

  // Convert coordinates to map position
  const coordToPosition = (lat: number, lng: number) => {
    const x = ((lng - TASIKMALAYA_BOUNDS.west) / (TASIKMALAYA_BOUNDS.east - TASIKMALAYA_BOUNDS.west)) * 100;
    const y = ((TASIKMALAYA_BOUNDS.north - lat) / (TASIKMALAYA_BOUNDS.north - TASIKMALAYA_BOUNDS.south)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  useEffect(() => {
    setMapLoaded(true);
    
    // Initialize driver positions
    const positions: {[key: number]: {x: number, y: number, direction: number}} = {};
    drivers.forEach(driver => {
      const pos = coordToPosition(driver.location[0], driver.location[1]);
      positions[driver.id] = {
        x: pos.x,
        y: pos.y,
        direction: Math.random() * 360
      };
    });
    setDriverPositions(positions);
  }, []);

  // Simulate driver movement
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setDriverPositions(prev => {
        const newPositions = { ...prev };
        
        drivers.forEach(driver => {
          if (driver.isOnline && newPositions[driver.id]) {
            const current = newPositions[driver.id];
            const speed = 0.3;
            const radians = (current.direction * Math.PI) / 180;
            
            let newX = current.x + Math.cos(radians) * speed;
            let newY = current.y + Math.sin(radians) * speed;
            
            if (newX < 5 || newX > 95) {
              current.direction = 180 - current.direction;
              newX = Math.max(5, Math.min(95, newX));
            }
            if (newY < 5 || newY > 95) {
              current.direction = -current.direction;
              newY = Math.max(5, Math.min(95, newY));
            }
            
            if (Math.random() < 0.08) {
              current.direction += (Math.random() - 0.5) * 60;
            }
            
            newPositions[driver.id] = {
              x: newX,
              y: newY,
              direction: current.direction
            };
          }
        });
        
        return newPositions;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [autoRefresh, drivers]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Use OpenStreetMap iframe with Tasikmalaya focus
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${TASIKMALAYA_BOUNDS.west}%2C${TASIKMALAYA_BOUNDS.south}%2C${TASIKMALAYA_BOUNDS.east}%2C${TASIKMALAYA_BOUNDS.north}&layer=mapnik&marker=${TASIKMALAYA_CENTER.lat}%2C${TASIKMALAYA_CENTER.lng}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    mapRef.current.innerHTML = '';
    mapRef.current.appendChild(iframe);

    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, []);

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
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              ref={mapRef}
              style={{ height, width: '100%' }} 
              className="rounded-lg overflow-hidden bg-gray-100"
            />
            
            {/* Driver overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {drivers.map(driver => {
                const position = driverPositions[driver.id] || coordToPosition(driver.location[0], driver.location[1]);
                const currentPos = typeof position.x !== 'undefined' ? position : coordToPosition(driver.location[0], driver.location[1]);
                
                return (
                  <div
                    key={driver.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-200 hover:scale-110 z-10"
                    style={{
                      left: `${currentPos.x}%`,
                      top: `${currentPos.y}%`,
                      transform: `translate(-50%, -50%) ${driver.isOnline && driverPositions[driver.id] ? `rotate(${driverPositions[driver.id].direction}deg)` : ''}`,
                    }}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className={`relative ${driver.isOnline ? '' : 'opacity-50'}`}>
                      {/* Driver icon */}
                      <div 
                        className={`w-8 h-8 flex items-center justify-center text-xl transition-all duration-200 ${
                          driver.isOnline ? 'text-green-600' : 'text-gray-500'
                        }`}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                        }}
                      >
                        🚲
                      </div>
                      
                      {/* Motion trail */}
                      {driver.isOnline && (
                        <div 
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)',
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      )}
                      
                      {/* Driver info popup */}
                      {selectedDriver?.id === driver.id && (
                        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-3 min-w-48 z-30">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{driver.name}</div>
                            <div className={`text-sm font-medium ${driver.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                              {driver.isOnline ? 'Sedang online' : 'Offline'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{driver.vehicleNumber}</div>
                            <div className="flex justify-between text-xs text-gray-600 mt-2">
                              <span>⭐ {driver.rating}</span>
                              <span>📦 {driver.totalDeliveries} trips</span>
                            </div>
                            {driver.isOnline && (
                              <div className="text-xs text-green-600 mt-1 font-medium">
                                🚲 Siap menerima pesanan
                              </div>
                            )}
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
            <span>📍 Peta real-time Tasikmalaya dengan nama jalan asli</span>
            <a 
              href={`https://www.openstreetmap.org/#map=14/${TASIKMALAYA_CENTER.lat}/${TASIKMALAYA_CENTER.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Lihat peta penuh
            </a>
          </div>
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
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">🚲 {driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">⭐ {driver.rating}</p>
                      <p className="text-xs text-gray-500">{driver.totalDeliveries} trips</p>
                    </div>
                  </div>
                </div>
              ))}
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
                <div key={driver.id} className="p-3 border rounded-lg opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">🚲 {driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">⭐ {driver.rating}</p>
                      <p className="text-xs text-gray-500">{driver.totalDeliveries} trips</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}