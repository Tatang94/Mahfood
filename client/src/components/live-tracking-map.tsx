import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import EnhancedMap from "@/components/enhanced-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Phone, Clock } from "lucide-react";

interface LiveTrackingMapProps {
  orderId: number;
  driverId?: number;
  customerLocation?: [number, number];
  restaurantLocation?: [number, number];
}

export default function LiveTrackingMap({ 
  orderId, 
  driverId, 
  customerLocation,
  restaurantLocation 
}: LiveTrackingMapProps) {
  const [trackingActive, setTrackingActive] = useState(true);

  // Fetch driver location in real-time
  const { data: driverLocation, refetch } = useQuery({
    queryKey: ["/api/drivers", driverId, "location"],
    queryFn: () => apiRequest(`/api/drivers/${driverId}/location`),
    enabled: !!driverId && trackingActive,
    refetchInterval: 5000, // Update every 5 seconds
    retry: false
  });

  // Fetch order details
  const { data: order } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () => apiRequest(`/api/orders/${orderId}`),
    enabled: !!orderId
  });

  const markers = [];

  // Add restaurant marker
  if (restaurantLocation) {
    markers.push({
      position: restaurantLocation,
      popup: "Restoran - Lokasi Pengambilan",
      icon: "🏪"
    });
  }

  // Add customer location marker
  if (customerLocation) {
    markers.push({
      position: customerLocation,
      popup: "Lokasi Pengiriman",
      icon: "🏠"
    });
  }

  // Add driver location marker if available
  if (driverLocation) {
    markers.push({
      position: [driverLocation.lat, driverLocation.lng],
      popup: `Driver - ${order?.driver?.name || 'Driver'}`,
      icon: "🚗"
    });
  }

  const mapCenter = driverLocation 
    ? [driverLocation.lat, driverLocation.lng] 
    : customerLocation || [-6.2088, 106.8456];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Live Tracking - Pesanan #{orderId}</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          {driverLocation && (
            <Badge variant="default" className="animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
              Live
            </Badge>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setTrackingActive(!trackingActive)}
          >
            {trackingActive ? "Pause" : "Resume"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div className="h-96 rounded-lg overflow-hidden border">
          <MapInteractive
            center={mapCenter as [number, number]}
            zoom={14}
            height="100%"
            markers={markers}
            disableInteraction={false}
          />
        </div>

        {/* Tracking Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-900">
              {order?.status === 'picked_up' ? 'Dalam Perjalanan' : 'Menunggu'}
            </div>
            <div className="text-sm text-blue-700">Status Pesanan</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-900">
              {driverLocation ? 'Online' : 'Offline'}
            </div>
            <div className="text-sm text-green-700">GPS Tracking</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-semibold text-orange-900 flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1" />
              ~12 min
            </div>
            <div className="text-sm text-orange-700">Estimasi Tiba</div>
          </div>
        </div>

        {/* Driver Info */}
        {order?.driver && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{order.driver.name}</h4>
                <p className="text-sm text-gray-600">
                  {order.driver.vehicleType} - {order.driver.vehicleNumber}
                </p>
                {driverLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last update: {new Date().toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Hubungi Driver
              </Button>
            </div>
          </div>
        )}

        {!driverLocation && driverId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              GPS tracking belum tersedia. Driver mungkin belum mengaktifkan lokasi atau sedang offline.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}