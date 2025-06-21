import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useNotifications } from "@/hooks/useNotifications";
import { useGeolocation } from "@/hooks/useGeolocation";
import MapInteractive from "@/components/map-interactive";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Car,
  User,
  Phone,
  DollarSign,
  Navigation,
  Package,
  Star,
  TrendingUp,
  Wallet,
  LogOut,
  RefreshCw
} from "lucide-react";

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  
  // Initialize WebSocket for real-time order notifications
  const { isConnected, lastMessage } = useWebSocket('driver', user?.id);
  
  // Initialize geolocation for driver tracking
  const { location, error: locationError } = useGeolocation();

  // Fetch driver profile
  const { data: driver } = useQuery({
    queryKey: ["/api/drivers/profile"],
    queryFn: () => apiRequest(`/api/drivers/profile?userId=${user?.id}`),
    enabled: !!user?.id
  });

  // Fetch available orders
  const { data: availableOrders = [], isLoading: availableLoading } = useQuery({
    queryKey: ["/api/orders/available"],
    queryFn: () => apiRequest("/api/orders/available"),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch driver's assigned orders
  const { data: myOrders = [], isLoading: myOrdersLoading } = useQuery({
    queryKey: ["/api/orders/driver"],
    queryFn: () => apiRequest(`/api/orders/driver/${driver?.id}`),
    enabled: !!driver?.id
  });

  // Fetch driver earnings
  const { data: earnings = [] } = useQuery({
    queryKey: ["/api/drivers/earnings"],
    queryFn: () => apiRequest(`/api/drivers/earnings/${driver?.id}`),
    enabled: !!driver?.id
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(`/api/orders/${orderId}/assign-driver`, {
        method: "PATCH",
        body: { driverId: driver?.id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/driver"] });
      toast({
        title: "Pesanan Diterima",
        description: "Anda telah menerima pesanan. Segera menuju restoran.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menerima pesanan",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/driver"] });
      toast({
        title: "Status Diperbarui",
        description: "Status pesanan berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui status pesanan",
        variant: "destructive",
      });
    },
  });

  // Toggle online status
  const toggleOnlineStatusMutation = useMutation({
    mutationFn: async (online: boolean) => {
      return apiRequest(`/api/drivers/${driver?.id}/status`, {
        method: "PATCH",
        body: { isOnline: online }
      });
    },
    onSuccess: () => {
      setIsOnline(!isOnline);
      toast({
        title: isOnline ? "Anda Offline" : "Anda Online",
        description: isOnline ? "Anda tidak akan menerima pesanan baru" : "Anda siap menerima pesanan",
      });
    },
  });

  // Handle incoming WebSocket messages (GoJek style notifications)
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_order') {
        // New order available - refresh available orders
        queryClient.invalidateQueries({ queryKey: ["/api/orders/available"] });
        
        // Show toast notification
        toast({
          title: "🚗 Pesanan Baru Tersedia!",
          description: `Tarif: ${formatCurrency(lastMessage.data?.driverEarnings || 0)} • Jarak: < 1 km`,
        });

        // Play notification sound
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(console.error);
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      } else if (lastMessage.type === 'order_ready_for_pickup') {
        queryClient.invalidateQueries({ queryKey: ["/api/orders/driver"] });
      }
    }
  }, [lastMessage, queryClient, toast]);

  // Update driver location when GPS position changes
  useEffect(() => {
    if (location && driver?.id && isOnline) {
      // Send location update to server
      apiRequest(`/api/drivers/${driver.id}/location`, {
        method: "PATCH",
        body: {
          lat: location.latitude,
          lng: location.longitude
        }
      }).catch(console.error);
    }
  }, [location, driver?.id, isOnline]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Siap Diambil';
      case 'picked_up': return 'Sedang Diantar';
      case 'delivered': return 'Berhasil Diantar';
      default: return status;
    }
  };

  // Calculate today's earnings
  const todayEarnings = earnings.filter((earning: any) => {
    const today = new Date().toDateString();
    return new Date(earning.createdAt).toDateString() === today;
  });

  const todayTotal = todayEarnings.reduce((sum: number, earning: any) => sum + earning.amount, 0);
  const totalEarnings = earnings.reduce((sum: number, earning: any) => sum + earning.amount, 0);

  if (!user || user.role !== 'driver') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
            <p className="text-gray-600 mb-4">Halaman ini khusus untuk driver</p>
            <Button onClick={() => window.location.href = '/driver/login'}>
              Login sebagai Driver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Driver</h1>
              <p className="text-gray-600">{user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
              <Button
                variant={isOnline ? "destructive" : "default"}
                size="sm"
                onClick={() => {
                  if (driver?.id) {
                    toggleOnlineStatusMutation.mutate(!isOnline);
                  } else {
                    toast({
                      title: "Error",
                      description: "Driver profile belum ditemukan",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={toggleOnlineStatusMutation.isPending || !driver?.id}
              >
                <Car className="w-4 h-4 mr-2" />
                {isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayTotal)}</div>
              <p className="text-xs text-muted-foreground">
                {todayEarnings.length} pesanan selesai
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {earnings.length} pesanan total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pesanan Aktif</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                Dalam proses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.9</div>
              <p className="text-xs text-muted-foreground">
                Dari 50+ pesanan
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="available" className="text-xs sm:text-sm px-2 py-3">
              <Package className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Pesanan </span>Tersedia
            </TabsTrigger>
            <TabsTrigger value="my-orders" className="text-xs sm:text-sm px-2 py-3">
              <Car className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Pesanan </span>Saya
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs sm:text-sm px-2 py-3">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Peta & </span>Lokasi
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs sm:text-sm px-2 py-3">
              <Wallet className="w-4 h-4 mr-1" />
              Pendapatan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Pesanan Tersedia</span>
                  {!isOnline && (
                    <Badge variant="secondary">Offline - Tidak menerima pesanan</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isOnline ? (
                  <div className="text-center py-8">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Anda Sedang Offline</h3>
                    <p className="text-gray-600 mb-4">Aktifkan status online untuk menerima pesanan</p>
                    <Button onClick={() => toggleOnlineStatusMutation.mutate(true)}>
                      <Car className="w-4 h-4 mr-2" />
                      Go Online
                    </Button>
                  </div>
                ) : availableLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tidak Ada Pesanan</h3>
                    <p className="text-gray-600">Pesanan baru akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <Package className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Pesanan #{order.id}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">{formatCurrency(Math.floor(order.deliveryFee * 0.8))}</p>
                            <p className="text-sm text-gray-600">Tarif Driver</p>
                            <p className="text-xs text-gray-500">Total: {formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Lokasi Pengambilan
                            </h4>
                            <p className="text-sm text-gray-600">{order.restaurantAddress}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Navigation className="w-4 h-4 mr-2" />
                              Tujuan Pengiriman
                            </h4>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="text-sm text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Jarak: &lt; 1 km • Estimasi: 5 menit
                          </div>
                          <Button
                            onClick={() => acceptOrderMutation.mutate(order.id)}
                            disabled={acceptOrderMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {acceptOrderMutation.isPending ? "Mengambil..." : "Ambil Pesanan"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="w-5 h-5" />
                  <span>Pesanan Saya</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myOrdersLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
                    <p className="text-gray-600">Pesanan yang Anda terima akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Location Display */}
                    {location && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-blue-900">Lokasi Anda Saat Ini</h4>
                            <p className="text-sm text-blue-700 break-all">
                              GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                            <p className="text-xs text-blue-600">
                              Akurasi: {location.accuracy?.toFixed(0) || 'N/A'} meter
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-blue-600">Live Tracking</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {locationError && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900">GPS Error</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          {locationError}. Pastikan izin lokasi telah diaktifkan untuk tracking real-time.
                        </p>
                      </div>
                    )}

                    {!location && !locationError && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Mencari Lokasi GPS...</h4>
                            <p className="text-sm text-gray-600">Mohon tunggu sementara sistem mengakses lokasi Anda</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {myOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Car className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Pesanan #{order.id}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Lokasi Pengambilan
                            </h4>
                            <p className="text-sm text-gray-600">{order.restaurantAddress}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Navigation className="w-4 h-4 mr-2" />
                              Tujuan Pengiriman
                            </h4>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg text-primary">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-sm text-gray-600">Ongkir: {formatCurrency(order.deliveryFee)}</p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'picked_up' })}
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                              >
                                <Package className="w-4 h-4 mr-2" />
                                {updateOrderStatusMutation.isPending ? "Mengambil..." : "Ambil Pesanan"}
                              </Button>
                            )}

                            {order.status === 'picked_up' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {updateOrderStatusMutation.isPending ? "Menyelesaikan..." : "Selesai Antar"}
                              </Button>
                            )}

                            {order.status === 'assigned' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                disabled
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Menunggu Restoran
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Peta & Lokasi Driver</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Location Status */}
                  {location ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">GPS Aktif</h4>
                          <p className="text-sm text-green-700">
                            Lokasi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Akurasi: {location.accuracy?.toFixed(0) || 'N/A'} meter
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-xs text-green-600 mt-1">Live</p>
                        </div>
                      </div>
                    </div>
                  ) : locationError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900">GPS Error</h4>
                      <p className="text-sm text-red-700">{locationError}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Pastikan izin lokasi diaktifkan di browser Anda
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900">Mencari Lokasi...</h4>
                      <p className="text-sm text-yellow-700">
                        Mohon tunggu sementara kami mengakses lokasi GPS Anda
                      </p>
                    </div>
                  )}

                  {/* Interactive Map */}
                  <div className="h-96 rounded-lg overflow-hidden border">
                    <MapInteractive
                      center={location ? [location.latitude, location.longitude] : [-6.2088, 106.8456]}
                      zoom={15}
                      height="100%"
                      markers={[
                        ...(location ? [{
                          position: [location.latitude, location.longitude] as [number, number],
                          popup: "Lokasi Anda Saat Ini",
                          icon: "🚗"
                        }] : []),
                        // Add nearby orders as markers
                        ...myOrders.slice(0, 3).map((order: any, index: number) => ({
                          position: [-6.2088 + (index * 0.01), 106.8456 + (index * 0.01)] as [number, number],
                          popup: `Pesanan #${order.id}`,
                          icon: "📦"
                        }))
                      ]}
                      showGpsButton={true}
                      disableInteraction={false}
                    />
                  </div>

                  {/* Location Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(() => {
                            toast({
                              title: "Lokasi Diperbarui",
                              description: "GPS location berhasil direfresh",
                            });
                          });
                        }
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Lokasi
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        if (location) {
                          const coords = `${location.latitude},${location.longitude}`;
                          navigator.clipboard.writeText(coords);
                          toast({
                            title: "Koordinat Disalin",
                            description: "Koordinat GPS telah disalin ke clipboard",
                          });
                        }
                      }}
                      disabled={!location}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Salin Koordinat
                    </Button>
                  </div>

                  {/* Nearby Orders */}
                  {myOrders.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Pesanan Terdekat</h3>
                      <div className="space-y-3">
                        {myOrders.slice(0, 3).map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">Pesanan #{order.id}</p>
                              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Navigation className="w-4 h-4 mr-2" />
                              Rute
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(todayTotal)}</p>
                      <p className="text-xs text-gray-600">Hari Ini</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(totalEarnings)}</p>
                      <p className="text-xs text-gray-600">Total Pendapatan</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{earnings.length}</p>
                      <p className="text-xs text-gray-600">Total Pesanan</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(earnings.length > 0 ? totalEarnings / earnings.length : 0)}
                      </p>
                      <p className="text-xs text-gray-600">Rata-rata</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5" />
                    <span>Riwayat Pendapatan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {earnings.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Belum Ada Pendapatan</h3>
                      <p className="text-gray-600">Mulai terima pesanan untuk melihat pendapatan Anda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {earnings.slice(0, 10).map((earning: any) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Pesanan #{earning.orderId}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(earning.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-green-600">
                            +{formatCurrency(earning.amount)}
                          </span>
                        </div>
                      ))}
                      {earnings.length > 10 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" size="sm">
                            Lihat Semua Riwayat
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}