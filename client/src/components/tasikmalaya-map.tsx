import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Batas kota Tasikmalaya (polygon)
const TASIKMALAYA_BOUNDS = [
  [-7.4000, 108.1500], // Southwest
  [-7.2500, 108.3000]  // Northeast
];

// Koordinat pusat Tasikmalaya
const TASIKMALAYA_CENTER: [number, number] = [-7.3274, 108.2207];

// Ikon motor Gojek untuk driver
const createDriverIcon = () => {
  return L.divIcon({
    className: 'driver-icon',
    html: `
      <div style="
        background: #00AA13;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 18px;
        animation: pulse 2s infinite;
      ">
        🚴
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface TasikmalayaMapProps {
  height?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  drivers?: Array<{
    id: number;
    name: string;
    location: [number, number];
    isOnline: boolean;
  }>;
  centerLocation?: [number, number];
  showDrivers?: boolean;
}

export default function TasikmalayaMap({ 
  height = "400px",
  onLocationSelect,
  drivers = [],
  centerLocation,
  showDrivers = true
}: TasikmalayaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkersRef = useRef<L.Marker[]>([]);
  const { latitude, longitude } = useGeolocation();

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Initialize map dengan batas kota Tasikmalaya
    const map = L.map(mapRef.current, {
      center: centerLocation || TASIKMALAYA_CENTER,
      zoom: 13,
      minZoom: 12, // Zoom minimum untuk mencegah zoom out terlalu jauh
      maxZoom: 18,
      maxBounds: TASIKMALAYA_BOUNDS, // Batas area yang bisa dilihat
      maxBoundsViscosity: 1.0, // Mencegah panning keluar area
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      crossOrigin: true
    }).addTo(map);

    // Add polygon untuk highlight area Tasikmalaya
    const tasikmalayaPolygon = L.rectangle(TASIKMALAYA_BOUNDS, {
      color: '#00AA13',
      weight: 3,
      opacity: 0.8,
      fillColor: '#00AA13',
      fillOpacity: 0.1
    }).addTo(map);

    // Add click handler untuk pemilihan lokasi
    if (onLocationSelect) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        // Cek apakah lokasi masih dalam batas Tasikmalaya
        if (lat >= TASIKMALAYA_BOUNDS[0][0] && lat <= TASIKMALAYA_BOUNDS[1][0] &&
            lng >= TASIKMALAYA_BOUNDS[0][1] && lng <= TASIKMALAYA_BOUNDS[1][1]) {
          onLocationSelect(lat, lng);
        }
      });
    }

    // Prevent panning outside bounds
    map.on('drag', () => {
      map.panInsideBounds(TASIKMALAYA_BOUNDS, { animate: false });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [centerLocation, onLocationSelect]);

  // Update driver markers
  useEffect(() => {
    if (!mapInstanceRef.current || !showDrivers) return;

    const map = mapInstanceRef.current;

    // Clear existing driver markers
    driverMarkersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    driverMarkersRef.current = [];

    // Add current drivers
    drivers.forEach(driver => {
      if (driver.isOnline && 
          driver.location[0] >= TASIKMALAYA_BOUNDS[0][0] && 
          driver.location[0] <= TASIKMALAYA_BOUNDS[1][0] &&
          driver.location[1] >= TASIKMALAYA_BOUNDS[0][1] && 
          driver.location[1] <= TASIKMALAYA_BOUNDS[1][1]) {
        
        const marker = L.marker(driver.location, {
          icon: createDriverIcon()
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>🏍️ ${driver.name}</strong><br>
            <span style="color: #00AA13; font-size: 12px;">● Online</span>
          </div>
        `);

        driverMarkersRef.current.push(marker);
      }
    });
  }, [drivers, showDrivers]);

  // Add user location marker if available
  useEffect(() => {
    if (!mapInstanceRef.current || !latitude || !longitude) return;

    const map = mapInstanceRef.current;

    // Cek apakah user location dalam batas Tasikmalaya
    if (latitude >= TASIKMALAYA_BOUNDS[0][0] && latitude <= TASIKMALAYA_BOUNDS[1][0] &&
        longitude >= TASIKMALAYA_BOUNDS[0][1] && longitude <= TASIKMALAYA_BOUNDS[1][1]) {
      
      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `
          <div style="
            background: #3B82F6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup('📍 Lokasi Anda');
    }
  }, [latitude, longitude]);

  return (
    <div className="w-full">
      <style>{`
        .leaflet-container {
          height: ${height};
          width: 100%;
          z-index: 1;
        }
        .driver-icon {
          z-index: 1000;
        }
        .user-location-icon {
          z-index: 999;
        }
      `}</style>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }} 
        className="rounded-lg border border-gray-200 overflow-hidden bg-gray-100"
      />
    </div>
  );
}