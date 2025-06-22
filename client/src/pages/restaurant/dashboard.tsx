import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/login-modal";
import { 
  Bell,
  ChefHat,
  Clock,
  CheckCircle,
  MapPin,
  Users,
  Timer,
  Phone,
  ArrowUp,
  Store,
  TrendingUp,
  Activity,
  User,
  ShoppingBag,
  DollarSign
} from "lucide-react";

interface TabButtonProps {
  id: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
  badge?: number;
}

function TabButton({ id, icon: Icon, label, isActive, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-colors relative ${
        isActive 
          ? 'text-green-600 bg-green-50' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState("pesanan");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout, isLoading: authLoading } = useAuth();

  // Authentication checks
  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginModal(true);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      setShowLoginModal(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'restaurant') {
      window.location.href = `/${user.role}`;
    }
  }, [user]);

  // Authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard restoran...</p>
        </div>
      </div>
    );
  }

  // Show login modal if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          defaultRole="restaurant"
        />
      </div>
    );
  }

  // Get restaurant data
  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants/profile", user?.id],
    queryFn: () => apiRequest(`/api/restaurants/profile?userId=${user?.id}`),
    enabled: !!user?.id,
  });

  // Get restaurant orders
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders/restaurant", restaurant?.id],
    queryFn: () => apiRequest(`/api/orders/restaurant?restaurantId=${restaurant?.id}`),
    enabled: !!restaurant?.id,
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/restaurant"] });
      toast({ title: "Status pesanan berhasil diperbarui" });
    },
    onError: () => {
      toast({ title: "Gagal memperbarui status pesanan", variant: "destructive" });
    },
  });

  // Calculate statistics
  const todayOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const pendingOrders = orders.filter((order: any) => order.status === 'pending');
  const activeOrders = orders.filter((order: any) => 
    ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
  );
  const completedToday = todayOrders.filter((order: any) => order.status === 'delivered');
  const todayRevenue = completedToday.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivering': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Dikonfirmasi';
      case 'preparing': return 'Sedang Dimasak';
      case 'ready': return 'Siap Diambil';
      case 'delivering': return 'Sedang Dikirim';
      case 'delivered': return 'Sudah Dikirim';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return { status: 'confirmed', label: 'Konfirmasi' };
      case 'confirmed': return { status: 'preparing', label: 'Mulai Masak' };
      case 'preparing': return { status: 'ready', label: 'Siap Ambil' };
      case 'ready': return { status: 'delivering', label: 'Kirim' };
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GoBiz Style Header */}
      <div className="bg-green-600 text-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Dashboard Mitra</h1>
                <p className="text-sm text-green-100">{restaurant?.name || 'Restoran Anda'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Bell className="w-5 h-5" />
                </Button>
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {activeTab === "pesanan" && (
          <div className="space-y-4">
            {/* Quick Stats - GoBiz Style */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100">Pesanan Baru</p>
                      <p className="text-2xl font-bold">{pendingOrders.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-100">Sedang Diproses</p>
                      <p className="text-2xl font-bold">{activeOrders.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Stats */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(todayRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pesanan Selesai</p>
                    <p className="text-lg font-bold text-gray-900">{completedToday.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pesanan</p>
                    <p className="text-lg font-bold text-gray-900">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List - GoBiz Style */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Kelola Pesanan</h3>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {orders.length} Total
                </Badge>
              </div>

              {orders.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Belum Ada Pesanan</h3>
                    <p className="text-sm text-gray-600">Pesanan akan muncul di sini ketika ada pelanggan yang memesan</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order: any) => {
                  const nextStatus = getNextStatus(order.status);
                  const isExpired = order.status === 'pending' && 
                    new Date().getTime() - new Date(order.createdAt).getTime() > 10 * 60 * 1000;

                  return (
                    <Card key={order.id} className={`border-0 shadow-sm ${order.status === 'pending' ? 'ring-2 ring-blue-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Order Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-green-600 text-sm">#{order.id}</span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                  {isExpired && (
                                    <Badge className="bg-red-100 text-red-800 border-red-200">
                                      <Timer className="w-3 h-3 mr-1" />
                                      Expired
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(order.createdAt).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-sm text-gray-600">{order.paymentMethod === 'cash' ? 'Tunai' : 'TasPay'}</p>
                            </div>
                          </div>

                          {/* Customer Info */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">Pelanggan #{order.customerId}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                              <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
                            </div>
                          </div>

                          {/* Order Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="border-t pt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Item Pesanan:</p>
                              <div className="space-y-1">
                                {order.items.map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                                    <span className="text-gray-900">{formatCurrency(item.total)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-2">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  disabled={updateOrderMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Terima Pesanan
                                </Button>
                                <Button
                                  onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                                  variant="outline"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  disabled={updateOrderMutation.isPending}
                                >
                                  Tolak
                                </Button>
                              </>
                            )}
                            
                            {nextStatus && order.status !== 'pending' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <Button
                                onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: nextStatus.status })}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={updateOrderMutation.isPending}
                              >
                                <ArrowUp className="w-4 h-4 mr-2" />
                                {nextStatus.label}
                              </Button>
                            )}

                            {order.status === 'ready' && (
                              <Button
                                variant="outline"
                                className="border-green-200 text-green-600 hover:bg-green-50"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Hubungi Driver
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "analitik" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Analitik Bisnis</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Pendapatan</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rating Restoran</p>
                      <p className="text-2xl font-bold text-gray-900">{restaurant?.rating || 5}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "profil" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Profil Restoran</h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nama Restoran</label>
                    <p className="text-gray-900">{restaurant?.name || 'Nama restoran belum diatur'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Alamat</label>
                    <p className="text-gray-900">{restaurant?.address || 'Alamat belum diatur'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telepon</label>
                    <p className="text-gray-900">{restaurant?.phone || user?.phone || 'Nomor telepon belum diatur'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge className={`${restaurant?.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {restaurant?.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{user?.email || 'Email belum diatur'}</p>
                  </div>
                  <Button 
                    onClick={logout}
                    variant="outline" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation - GoBiz Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
        <div className="grid grid-cols-3 gap-1">
          <TabButton 
            id="pesanan" 
            icon={ShoppingBag} 
            label="Pesanan" 
            isActive={activeTab === "pesanan"}
            onClick={setActiveTab}
            badge={pendingOrders.length}
          />
          <TabButton 
            id="analitik" 
            icon={TrendingUp} 
            label="Analitik" 
            isActive={activeTab === "analitik"}
            onClick={setActiveTab}
          />
          <TabButton 
            id="profil" 
            icon={User} 
            label="Profil" 
            isActive={activeTab === "profil"}
            onClick={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}