import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin, Navigation } from "lucide-react";

// Tasikmalaya boundaries
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

interface SimpleTasikmalayaMapProps {
  height?: string;
  showDriverList?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SimpleTasikmalayaMap({ 
  height = "500px",
  showDriverList = true,
  autoRefresh = true,
  refreshInterval = 10000
}: SimpleTasikmalayaMapProps) {
  const [drivers] = useState<Driver[]>([
    {
      id: 1,
      name: "Budi Santoso",
      location: [-7.3274, 108.2207],
      isOnline: true,
      vehicleNumber: "B 1234 ABC",
      rating: 4.8,
      totalDeliveries: 245
    },
    {
      id: 2,
      name: "Ahmad Rizki", 
      location: [-7.3184, 108.2157],
      isOnline: true,
      vehicleNumber: "B 5678 DEF",
      rating: 4.9,
      totalDeliveries: 312
    },
    {
      id: 3,
      name: "Dedi Kurniawan",
      location: [-7.3364, 108.2257],
      isOnline: false,
      vehicleNumber: "B 9012 GHI", 
      rating: 4.7,
      totalDeliveries: 198
    },
    {
      id: 4,
      name: "Wahyu Pratama",
      location: [-7.3174, 108.2307],
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
        direction: Math.random() * 360 // Random initial direction
      };
    });
    setDriverPositions(positions);
  }, []);

  // Simulate driver movement along roads
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setDriverPositions(prev => {
        const newPositions = { ...prev };
        
        drivers.forEach(driver => {
          if (driver.isOnline && newPositions[driver.id]) {
            const current = newPositions[driver.id];
            
            // Move driver slightly in current direction
            const speed = 0.5; // Movement speed
            const radians = (current.direction * Math.PI) / 180;
            
            let newX = current.x + Math.cos(radians) * speed;
            let newY = current.y + Math.sin(radians) * speed;
            
            // Keep within bounds and simulate road following
            if (newX < 5 || newX > 95) {
              current.direction = 180 - current.direction; // Bounce off horizontal walls
              newX = Math.max(5, Math.min(95, newX));
            }
            if (newY < 5 || newY > 95) {
              current.direction = -current.direction; // Bounce off vertical walls
              newY = Math.max(5, Math.min(95, newY));
            }
            
            // Occasionally change direction (simulate turns at intersections)
            if (Math.random() < 0.1) {
              current.direction += (Math.random() - 0.5) * 90;
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
    }, 200); // Update every 200ms for smooth movement
    
    return () => clearInterval(interval);
  }, [autoRefresh, drivers]);

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
          <div 
            style={{ height, width: '100%' }} 
            className="relative rounded-lg border border-gray-300 overflow-hidden bg-gray-100"
          >
            {/* Road Map Background */}
            <div className="absolute inset-0">
              <svg width="100%" height="100%">
                <defs>
                  {/* Road pattern */}
                  <pattern id="roads" patternUnits="userSpaceOnUse" width="100" height="100">
                    <rect width="100" height="100" fill="#e5e7eb"/>
                    {/* Main roads - gray background */}
                    <rect x="0" y="45" width="100" height="10" fill="#d1d5db"/>
                    <rect x="45" y="0" width="10" height="100" fill="#d1d5db"/>
                    {/* Road markings - subtle */}
                    <rect x="0" y="49" width="100" height="2" fill="#9ca3af"/>
                    <rect x="49" y="0" width="2" height="100" fill="#9ca3af"/>
                  </pattern>
                  
                  {/* Buildings */}
                  <pattern id="buildings" patternUnits="userSpaceOnUse" width="50" height="50">
                    <rect width="50" height="50" fill="transparent"/>
                    <rect x="5" y="5" width="15" height="15" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5"/>
                    <rect x="25" y="5" width="20" height="12" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5"/>
                    <rect x="5" y="25" width="18" height="20" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5"/>
                    <rect x="30" y="30" width="15" height="15" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                
                {/* Base map - Gojek style */}
                <rect width="100%" height="100%" fill="#f5f5f5"/>
                
                {/* Buildings layer - lighter and more realistic */}
                <rect width="100%" height="100%" fill="url(#buildings)" opacity="0.4"/>
                
                {/* Roads layer */}
                <rect width="100%" height="100%" fill="url(#roads)" opacity="0.9"/>
                
                {/* Major roads - Gojek style white roads */}
                <g stroke="#ffffff" strokeWidth="4" fill="none">
                  {/* Horizontal main roads */}
                  <line x1="0" y1="25%" x2="100%" y2="25%"/>
                  <line x1="0" y1="50%" x2="100%" y2="50%"/>
                  <line x1="0" y1="75%" x2="100%" y2="75%"/>
                  
                  {/* Vertical main roads */}
                  <line x1="25%" y1="0" x2="25%" y2="100%"/>
                  <line x1="50%" y1="0" x2="50%" y2="100%"/>
                  <line x1="75%" y1="0" x2="75%" y2="100%"/>
                  
                  {/* Diagonal roads */}
                  <line x1="0" y1="0" x2="50%" y2="30%"/>
                  <line x1="50%" y1="70%" x2="100%" y2="100%"/>
                  <line x1="20%" y1="100%" x2="80%" y2="60%"/>
                </g>
                
                {/* Secondary roads */}
                <g stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8">
                  <line x1="0" y1="10%" x2="100%" y2="10%"/>
                  <line x1="0" y1="35%" x2="100%" y2="35%"/>
                  <line x1="0" y1="65%" x2="100%" y2="65%"/>
                  <line x1="0" y1="90%" x2="100%" y2="90%"/>
                  <line x1="10%" y1="0" x2="10%" y2="100%"/>
                  <line x1="35%" y1="0" x2="35%" y2="100%"/>
                  <line x1="65%" y1="0" x2="65%" y2="100%"/>
                  <line x1="90%" y1="0" x2="90%" y2="100%"/>
                </g>
                
                {/* Landmarks - minimal style */}
                <g>
                  {/* Alun-alun */}
                  <circle cx="50%" cy="50%" r="12" fill="#e8f5e8" stroke="#4ade80" strokeWidth="1"/>
                  <text x="50%" y="50%" textAnchor="middle" dy="3" fontSize="6" fill="#16a34a" fontWeight="500">Alun-alun</text>
                  
                  {/* Stasiun */}
                  <rect x="18%" y="18%" width="16" height="12" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1"/>
                  <text x="20%" y="25%" fontSize="5" fill="#0369a1" fontWeight="500">Stasiun</text>
                  
                  {/* Mall */}
                  <rect x="72%" y="72%" width="20" height="16" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1"/>
                  <text x="74%" y="81%" fontSize="5" fill="#d97706" fontWeight="500">Mall</text>
                </g>
              </svg>
            </div>

            {/* City boundary - subtle Gojek style */}
            <div className="absolute inset-2 border border-gray-300 rounded bg-white/10">
              <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded shadow-sm text-xs font-medium text-gray-700">
                Tasikmalaya
              </div>
            </div>

            {/* Driver markers */}
            {drivers.map(driver => {
              const position = driverPositions[driver.id] || coordToPosition(driver.location[0], driver.location[1]);
              const currentPos = typeof position.x !== 'undefined' ? position : coordToPosition(driver.location[0], driver.location[1]);
              
              return (
                <div
                  key={driver.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                    selectedDriver?.id === driver.id ? 'scale-125 z-20' : 'z-10'
                  }`}
                  style={{
                    left: `${currentPos.x}%`,
                    top: `${currentPos.y}%`,
                    transform: `translate(-50%, -50%) ${driver.isOnline && driverPositions[driver.id] ? `rotate(${driverPositions[driver.id].direction}deg)` : ''}`,
                  }}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className={`relative ${driver.isOnline ? '' : 'opacity-50'}`}>
                    {/* Driver icon - Gojek style bicycle */}
                    <div 
                      className={`w-8 h-8 flex items-center justify-center text-xl transition-all duration-200 ${
                        driver.isOnline ? 'text-green-600' : 'text-gray-500'
                      }`}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    >
                      🚲
                    </div>
                    
                    {/* Motion trail - subtle shadow effect */}
                    {driver.isOnline && (
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
                          animation: 'pulse 2s infinite'
                        }}
                      ></div>
                    )}
                    
                    {/* Driver info popup */}
                    {selectedDriver?.id === driver.id && (
                      <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-3 min-w-48 z-30">
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
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Map controls overlay */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow p-2">
              <div className="text-xs text-gray-600">
                📍 Tasikmalaya
              </div>
            </div>
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}