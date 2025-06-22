import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AddMenuModal from "@/components/add-menu-modal";
import LoginModal from "@/components/login-modal";
import { 
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  Package,
  AlertCircle,
  ArrowUp,
  Bell,
  Settings,
  Plus,
  Edit,
  Eye,
  LogOut,
  BarChart3,
  FileText,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Camera,
  Save,
  X,
  Search,
  Filter,
  MoreVertical,
  Trash2
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
  const [activeTab, setActiveTab] = useState("beranda");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMenuCategory, setSelectedMenuCategory] = useState("all");
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

  // Get restaurant menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/food-items/restaurant", restaurant?.id],
    queryFn: () => apiRequest(`/api/food-items/restaurant/${restaurant?.id}`),
    enabled: !!restaurant?.id,
  });

  // Get restaurant stats
  const { data: stats } = useQuery({
    queryKey: ["/api/restaurants/stats", restaurant?.id],
    queryFn: () => apiRequest(`/api/restaurants/${restaurant?.id}/stats`),
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

  // Toggle menu item availability
  const toggleMenuItemMutation = useMutation({
    mutationFn: ({ itemId, isAvailable }: { itemId: number; isAvailable: boolean }) =>
      apiRequest(`/api/food-items/${itemId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/restaurant"] });
      toast({ title: "Status menu berhasil diperbarui" });
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

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedMenuCategory === 'all' || item.categoryId.toString() === selectedMenuCategory;
    return matchesSearch && matchesCategory;
  });

  // Render different tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'beranda':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pesanan Hari Ini</p>
                      <p className="text-xl font-bold text-gray-900">{todayOrders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pesanan Aktif</p>
                      <p className="text-xl font-bold text-gray-900">{activeOrders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-xl font-bold text-gray-900">{restaurant?.rating || 5.0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pesanan Terbaru</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('pesanan')}
                  >
                    Lihat Semua
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Belum ada pesanan hari ini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium">Pesanan #{order.id}</p>
                            <Badge className={`text-xs border ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                        {getNextStatus(order.status) && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderMutation.mutate({
                              orderId: order.id,
                              status: getNextStatus(order.status)!.status
                            })}
                            disabled={updateOrderMutation.isPending}
                          >
                            {getNextStatus(order.status)!.label}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'pesanan':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Kelola Pesanan</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{pendingOrders.length} Menunggu</Badge>
                <Badge className="bg-blue-100 text-blue-800">{activeOrders.length} Aktif</Badge>
              </div>
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pesanan</h3>
                  <p className="text-gray-600">Pesanan akan muncul di sini ketika pelanggan memesan</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">Pesanan #{order.id}</h3>
                            <Badge className={`text-xs border ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(order.createdAt).toLocaleString('id-ID')}
                          </p>
                          <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="flex space-x-2">
                          {getNextStatus(order.status) && (
                            <Button
                              onClick={() => updateOrderMutation.mutate({
                                orderId: order.id,
                                status: getNextStatus(order.status)!.status
                              })}
                              disabled={updateOrderMutation.isPending}
                              size="sm"
                            >
                              {getNextStatus(order.status)!.label}
                            </Button>
                          )}
                          {order.status === 'pending' && (
                            <Button
                              variant="outline"
                              onClick={() => updateOrderMutation.mutate({
                                orderId: order.id,
                                status: 'cancelled'
                              })}
                              disabled={updateOrderMutation.isPending}
                              size="sm"
                            >
                              Tolak
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Alamat Pengiriman:</h4>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>
                          {order.customerNotes && (
                            <div>
                              <h4 className="font-medium mb-2">Catatan:</h4>
                              <p className="text-sm text-gray-600">{order.customerNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold">Kelola Menu</h2>
                <p className="text-sm text-gray-600">{menuItems.length} item menu</p>
              </div>
              <Button onClick={() => setShowAddMenuModal(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={selectedMenuCategory}
                onChange={(e) => setSelectedMenuCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Semua Kategori</option>
                <option value="1">Makanan Utama</option>
                <option value="2">Minuman</option>
                <option value="3">Snack</option>
                <option value="4">Dessert</option>
              </select>
            </div>

            {/* Menu Items Grid */}
            {filteredMenuItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Menu</h3>
                  <p className="text-gray-600 mb-4">Mulai tambahkan menu untuk restoran Anda</p>
                  <Button onClick={() => setShowAddMenuModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Menu Pertama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-200 relative">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={(checked) => 
                            toggleMenuItemMutation.mutate({
                              itemId: item.id,
                              isAvailable: checked
                            })
                          }
                        />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <Badge variant={item.isAvailable ? "default" : "secondary"}>
                          {item.isAvailable ? "Tersedia" : "Habis"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(item.price)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {item.isPopular && (
                        <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Populer
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'laporan':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Laporan & Analitik</h2>
            
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">Pendapatan Hari Ini</h3>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</p>
                  <p className="text-sm text-gray-600">{stats?.todayOrders || 0} pesanan</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Minggu Ini</h3>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.thisWeekRevenue || 0)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">+12%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium">Bulan Ini</h3>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.thisMonthRevenue || 0)}</p>
                  <p className="text-sm text-gray-600">Target: 75%</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Metrik Performa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{restaurant?.rating || 5.0}</p>
                    <p className="text-sm text-gray-600">Rating Rata-rata</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                    <p className="text-sm text-gray-600">Total Pesanan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">25 min</p>
                    <p className="text-sm text-gray-600">Waktu Persiapan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">95%</p>
                    <p className="text-sm text-gray-600">Tingkat Penerimaan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'profil':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Profil Restoran</h2>
              <Button 
                variant="outline" 
                onClick={() => setEditingRestaurant(!editingRestaurant)}
              >
                {editingRestaurant ? 'Batal' : 'Edit Profil'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Restaurant Photo */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Foto Restoran</label>
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      {restaurant?.imageUrl ? (
                        <img 
                          src={restaurant.imageUrl} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload foto restoran</p>
                        </div>
                      )}
                    </div>
                    {editingRestaurant && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Camera className="w-4 h-4 mr-2" />
                        Ubah Foto
                      </Button>
                    )}
                  </div>

                  {/* Restaurant Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nama Restoran</label>
                      {editingRestaurant ? (
                        <Input defaultValue={restaurant?.name} />
                      ) : (
                        <p className="text-gray-900">{restaurant?.name || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Deskripsi</label>
                      {editingRestaurant ? (
                        <Textarea defaultValue={restaurant?.description} rows={3} />
                      ) : (
                        <p className="text-gray-900">{restaurant?.description || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Alamat</label>
                      {editingRestaurant ? (
                        <Textarea defaultValue={restaurant?.address} rows={2} />
                      ) : (
                        <p className="text-gray-900 flex items-start">
                          <MapPin className="w-4 h-4 mt-1 mr-2 text-gray-500" />
                          {restaurant?.address || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
                      {editingRestaurant ? (
                        <Input defaultValue={restaurant?.phone} />
                      ) : (
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          {restaurant?.phone || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        {user?.email || '-'}
                      </p>
                    </div>

                    {editingRestaurant && (
                      <div className="flex space-x-3 pt-4">
                        <Button className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Simpan Perubahan
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingRestaurant(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Status Restoran</h4>
                      <p className="text-sm text-gray-600">Aktifkan untuk menerima pesanan</p>
                    </div>
                    <Switch checked={restaurant?.isActive} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifikasi Pesanan</h4>
                      <p className="text-sm text-gray-600">Terima notifikasi untuk pesanan baru</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={logout}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Keluar dari Akun
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Tab tidak ditemukan</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard Mitra</h1>
                <p className="text-sm text-gray-600">{restaurant?.name || 'Restoran Anda'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1">
        <div className="grid grid-cols-5 gap-1">
          <TabButton
            id="beranda"
            icon={Home}
            label="Beranda"
            isActive={activeTab === "beranda"}
            onClick={setActiveTab}
          />
          <TabButton
            id="pesanan"
            icon={ShoppingBag}
            label="Pesanan"
            isActive={activeTab === "pesanan"}
            onClick={setActiveTab}
            badge={pendingOrders.length}
          />
          <TabButton
            id="menu"
            icon={UtensilsCrossed}
            label="Menu"
            isActive={activeTab === "menu"}
            onClick={setActiveTab}
          />
          <TabButton
            id="laporan"
            icon={BarChart3}
            label="Laporan"
            isActive={activeTab === "laporan"}
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

      {/* Add Menu Modal */}
      {showAddMenuModal && (
        <AddMenuModal
          isOpen={showAddMenuModal}
          onClose={() => setShowAddMenuModal(false)}
          restaurantId={restaurant?.id}
        />
      )}
    </div>
  );
}

      {/* Main Content */}
      <div className="p-4 pb-20">
        {activeTab === "beranda" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pesanan Hari Ini</p>
                      <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Placeholder */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Tren Penjualan 7 Hari Terakhir</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Grafik Penjualan</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Pesanan Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-orange-600 text-xs">#{order.id}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Customer #{order.customerId}</p>
                          <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "pesanan" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Kelola Pesanan</h3>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
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
                                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
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
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                disabled={updateOrderMutation.isPending}
                              >
                                <ArrowUp className="w-4 h-4 mr-2" />
                                {nextStatus.label}
                              </Button>
                            )}

                            {order.status === 'ready' && (
                              <Button
                                variant="outline"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
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

        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Menu Restoran</h2>
              <Button 
                onClick={() => setShowAddMenuModal(true)}
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu
              </Button>
            </div>
            <Card className="border-0 shadow-sm bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <UtensilsCrossed className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Kelola Menu Restoran</h3>
                <p className="text-sm text-gray-600 mb-4">Tambah, edit, atau hapus item menu untuk restoran Anda</p>
                <Button 
                  onClick={() => setShowAddMenuModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Tambah Menu Pertama
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "promo" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Promo & Diskon</h2>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Buat Promo
              </Button>
            </div>
            <Card className="border-0 shadow-sm bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <Tag className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Belum Ada Promo Aktif</h3>
                <p className="text-sm text-gray-600 mb-4">Buat promo menarik untuk meningkatkan penjualan Anda</p>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Mulai Buat Promo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "akun" && (
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
                    <Badge className={`${restaurant?.isActive ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {restaurant?.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{user?.email || 'Email belum diatur'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profil
                    </Button>
                    <Button 
                      onClick={logout}
                      variant="outline" 
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Menu Modal */}
      {restaurantId && (
        <AddMenuModal
          isOpen={showAddMenuModal}
          onClose={() => setShowAddMenuModal(false)}
          restaurantId={restaurantId}
        />
      )}

      {/* Bottom Navigation - TasFood Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="grid grid-cols-5 gap-1">
          <TabButton 
            id="beranda" 
            icon={Home} 
            label="Beranda" 
            isActive={activeTab === "beranda"}
            onClick={setActiveTab}
          />
          <TabButton 
            id="pesanan" 
            icon={ShoppingBag} 
            label="Pesanan" 
            isActive={activeTab === "pesanan"}
            onClick={setActiveTab}
            badge={pendingOrders.length}
          />
          <TabButton 
            id="menu" 
            icon={UtensilsCrossed} 
            label="Menu" 
            isActive={activeTab === "menu"}
            onClick={setActiveTab}
          />
          <TabButton 
            id="promo" 
            icon={Tag} 
            label="Promo" 
            isActive={activeTab === "promo"}
            onClick={setActiveTab}
          />
          <TabButton 
            id="akun" 
            icon={User} 
            label="Akun" 
            isActive={activeTab === "akun"}
            onClick={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}