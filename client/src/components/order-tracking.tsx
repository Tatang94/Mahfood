import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Truck, ChefHat, MapPin, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MapInteractive from "@/components/map-interactive";

interface OrderTrackingProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export default function OrderTracking({ isOpen, onClose, orderId }: OrderTrackingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(25);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);

  // Fetch order details for real tracking
  const { data: order } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () => apiRequest(`/api/orders/${orderId}`),
    enabled: !!orderId && isOpen,
    refetchInterval: 30000 // Update every 30 seconds
  });

  const steps = [
    { id: 0, title: "Pesanan Diterima", desc: "Pesanan Anda sedang diverifikasi", icon: CheckCircle },
    { id: 1, title: "Sedang Dimasak", desc: "Chef sedang menyiapkan makanan", icon: ChefHat },
    { id: 2, title: "Siap Diantar", desc: "Makanan siap untuk diantar", icon: Clock },
    { id: 3, title: "Dalam Perjalanan", desc: "Kurir sedang menuju lokasi Anda", icon: Truck },
    { id: 4, title: "Pesanan Selesai", desc: "Makanan telah sampai di tujuan", icon: CheckCircle },
  ];

  useEffect(() => {
    if (!isOpen || !order) return;

    // Set current step based on order status
    switch (order.status) {
      case 'pending':
        setCurrentStep(0);
        setEstimatedTime(30);
        break;
      case 'preparing':
        setCurrentStep(1);
        setEstimatedTime(20);
        break;
      case 'ready':
        setCurrentStep(2);
        setEstimatedTime(15);
        break;
      case 'picked_up':
        setCurrentStep(3);
        setEstimatedTime(10);
        // Simulate driver location updates
        const locations: [number, number][] = [
          [-6.2088, 106.8456], // Start point
          [-6.2150, 106.8400], // Mid point
          [-6.2200, 106.8350], // Near destination
        ];
        let locationIndex = 0;
        const locationInterval = setInterval(() => {
          if (locationIndex < locations.length) {
            setDriverLocation(locations[locationIndex]);
            locationIndex++;
          }
        }, 5000);
        return () => clearInterval(locationInterval);
      case 'delivered':
        setCurrentStep(4);
        setEstimatedTime(0);
        break;
    }
  }, [isOpen, order]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lacak Pesanan</DialogTitle>
          {orderId && (
            <p className="text-sm text-gray-500">ID Pesanan: {orderId}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {estimatedTime > 0 ? `${estimatedTime} menit` : "Selesai"}
            </div>
            <p className="text-gray-600">
              {estimatedTime > 0 ? "Estimasi waktu tiba" : "Pesanan telah selesai"}
            </p>
          </div>

          <Progress value={progress} className="w-full" />

          {/* Real-time Map Tracking */}
          {currentStep >= 3 && driverLocation && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Lokasi Driver Real-time
              </h4>
              <div className="h-64 rounded-lg overflow-hidden border">
                <MapInteractive
                  center={driverLocation}
                  zoom={15}
                  height="100%"
                  markers={[
                    {
                      position: driverLocation,
                      popup: "Driver sedang menuju lokasi Anda",
                      icon: "🚗"
                    }
                  ]}
                  disableInteraction={true}
                />
              </div>
              {order?.driver && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Driver: {order.driver.name}</p>
                      <p className="text-sm text-blue-700">Plat: {order.driver.vehicleNumber}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Hubungi
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isActive ? "bg-primary/10" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? "bg-primary text-white" : "bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? "text-primary" : "text-gray-500"}`}>
                      {step.title}
                      {isCurrent && <span className="ml-2 text-xs">(Saat ini)</span>}
                    </div>
                    <div className="text-sm text-gray-600">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Tips:</strong> Pastikan Anda berada di lokasi pengiriman dan nomor telepon aktif
              untuk memudahkan kurir menghubungi Anda.
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}