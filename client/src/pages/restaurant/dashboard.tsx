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
  User,
  DollarSign,
  Clock,
  Package,
  Bell,
  Plus,
  Edit,
  LogOut,
  BarChart3,
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
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

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

  // Get categories for menu management
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
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

  // Toggle menu item availability
  const toggleMenuMutation = useMutation({
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
    onError: () => {
      toast({ title: "Gagal memperbarui status menu", variant: "destructive" });
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
      case 'preparing': return 'Sedang Diproses';
      case 'ready': return 'Siap Diambil';
      case 'delivering': return 'Sedang Dikirim';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category?.name || 'Tanpa Kategori';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "beranda":
        return (
          <div className="p-4 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pesanan Hari Ini</p>
                      <p className="text-2xl font-bold text-green-600">{todayOrders.length}</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(todayRevenue)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pesanan Aktif ({activeOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeOrders.length > 0 ? (
                  <div className="space-y-3">
                    {activeOrders.slice(0, 3).map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Tidak ada pesanan aktif</p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "pesanan":
        return (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Kelola Pesanan</h2>
              <Badge variant="secondary">{orders.length} Total</Badge>
            </div>
            
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.items?.length || 0} item(s)
                        </p>
                        
                        {order.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                            >
                              Tolak
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                            >
                              Terima
                            </Button>
                          </div>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            className="mt-3"
                            onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'preparing' })}
                          >
                            Mulai Masak
                          </Button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            className="mt-3"
                            onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'ready' })}
                          >
                            Siap Diambil
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada pesanan</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "menu":
        return (
          <div className="p-4 space-y-4">
            {/* Menu Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Kelola Menu</h2>
              <Button onClick={() => setShowAddMenuModal(true)} size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cari menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Menu Statistics */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-sm text-gray-600">Total Menu</p>
                  <p className="text-lg font-bold">{menuItems.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-sm text-gray-600">Menu Aktif</p>
                  <p className="text-lg font-bold text-green-600">
                    {menuItems.filter((item: any) => item.isAvailable).length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-sm text-gray-600">Menu Non-Aktif</p>
                  <p className="text-lg font-bold text-red-600">
                    {menuItems.filter((item: any) => !item.isAvailable).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Menu Items */}
            {menuItems.length > 0 ? (
              <div className="space-y-3">
                {menuItems
                  .filter((item: any) => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item: any) => (
                  <Card key={item.id} className={`${!item.isAvailable ? 'opacity-60 bg-gray-50' : 'bg-white'} border transition-all hover:shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-lg">{item.name}</h3>
                              <p className="text-sm text-gray-600 mb-1 line-clamp-2">{item.description}</p>
                              <p className="text-xs text-gray-500 mb-2">{getCategoryName(item.categoryId)}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-2">
                              {item.isAvailable ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-red-500" />
                              )}
                              <Switch
                                checked={item.isAvailable}
                                onCheckedChange={(checked) => 
                                  toggleMenuMutation.mutate({ itemId: item.id, isAvailable: checked })
                                }
                                size="sm"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-lg text-orange-600">{formatCurrency(item.price)}</p>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-blue-50">
                                <Edit className="w-3 h-3 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <Badge 
                              variant={item.isAvailable ? "default" : "secondary"} 
                              className={`text-xs ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {item.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                            </Badge>
                            
                            {/* Popularity indicator */}
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-500">4.5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum ada menu</h3>
                  <p className="text-gray-500 mb-4">Mulai tambahkan menu pertama untuk restoran Anda</p>
                  <Button onClick={() => setShowAddMenuModal(true)} className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Menu Pertama
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "laporan":
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Laporan & Analitik</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Pesanan</p>
                      <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Menu Aktif</p>
                      <p className="text-2xl font-bold">{menuItems.filter((item: any) => item.isAvailable).length}</p>
                    </div>
                    <UtensilsCrossed className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performa Bulan Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Pesanan Selesai:</span>
                    <span className="font-medium">{orders.filter((o: any) => o.status === 'delivered').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pesanan Dibatalkan:</span>
                    <span className="font-medium">{orders.filter((o: any) => o.status === 'cancelled').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rating Rata-rata:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">4.5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "profil":
        return (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Profil Restoran</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingRestaurant(!editingRestaurant)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {editingRestaurant ? 'Batal' : 'Edit'}
              </Button>
            </div>

            {restaurant && (
              <Card>
                <CardContent className="p-4">
                  {editingRestaurant ? (
                    <RestaurantEditForm restaurant={restaurant} onSave={() => setEditingRestaurant(false)} />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Camera className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                          <p className="text-gray-600">{restaurant.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{restaurant.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{restaurant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{restaurant.operatingHours}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultRole="restaurant"
      />

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {restaurant?.name || 'Dashboard Mitra'}
            </h1>
            <p className="text-sm text-gray-600">
              Selamat datang, {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {pendingOrders.length} Pesanan Baru
              </Badge>
            )}
            <Bell className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 gap-1 px-2 py-1">
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

// Restaurant Edit Form Component
function RestaurantEditForm({ restaurant, onSave }: { restaurant: any; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    operatingHours: restaurant.operatingHours || ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRestaurantMutation = useMutation({
    mutationFn: (updates: any) =>
      apiRequest(`/api/restaurants/${restaurant.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/profile"] });
      toast({ title: "Profil restoran berhasil diperbarui" });
      onSave();
    },
    onError: () => {
      toast({ title: "Gagal memperbarui profil restoran", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nama Restoran</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nama restoran"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Deskripsi restoran"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Alamat</label>
        <Textarea
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Alamat lengkap"
          rows={2}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="08xxx-xxxx-xxxx"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Jam Operasional</label>
        <Input
          value={formData.operatingHours}
          onChange={(e) => setFormData(prev => ({ ...prev, operatingHours: e.target.value }))}
          placeholder="09:00 - 22:00"
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" disabled={updateRestaurantMutation.isPending} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {updateRestaurantMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button type="button" variant="outline" onClick={onSave}>
          <X className="w-4 h-4 mr-2" />
          Batal
        </Button>
      </div>
    </form>
  );
}

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
          ? 'text-orange-600 bg-orange-50' 
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