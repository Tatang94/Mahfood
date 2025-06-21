import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  MapPin,
  Phone,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Star,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '1',
    imageUrl: '',
    ingredients: '',
    prepTime: ''
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    imageUrl: ''
  });
  
  // Initialize WebSocket for real-time order notifications
  const { isConnected, lastMessage } = useWebSocket('restaurant', user?.id);

  // Fetch restaurant profile
  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants/profile"],
    queryFn: () => apiRequest(`/api/restaurants/profile?userId=${user?.id}`),
    enabled: !!user?.id
  });

  // Fetch orders for restaurant
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders/restaurant"],
    queryFn: () => apiRequest(`/api/orders/restaurant?restaurantId=${restaurant?.id}`),
    enabled: !!restaurant?.id
  });

  // Fetch menu items for restaurant
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["/api/restaurants/menu", restaurant?.id],
    queryFn: () => apiRequest(`/api/restaurants/${restaurant?.id}/menu`),
    enabled: !!restaurant?.id
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories")
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
      queryClient.invalidateQueries({ queryKey: ["/api/orders/restaurant"] });
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

  // Add menu item mutation
  const addMenuItemMutation = useMutation({
    mutationFn: async (menuData: any) => {
      return apiRequest(`/api/restaurants/${restaurant?.id}/menu`, {
        method: "POST",
        body: {
          ...menuData,
          price: parseInt(menuData.price),
          categoryId: parseInt(menuData.categoryId),
          prepTime: parseInt(menuData.prepTime) || 15,
          ingredients: menuData.ingredients.split(',').map((i: string) => i.trim()).filter((i: string) => i),
          isPopular: false,
          rating: 0
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/menu"] });
      setIsAddMenuOpen(false);
      setMenuForm({
        name: '',
        description: '',
        price: '',
        categoryId: '1',
        imageUrl: '',
        ingredients: '',
        prepTime: ''
      });
      toast({
        title: "Menu Ditambahkan",
        description: "Menu baru berhasil ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menambahkan menu",
        variant: "destructive",
      });
    },
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest(`/api/restaurants/${restaurant?.id}/menu/${itemId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/menu"] });
      toast({
        title: "Menu Dihapus",
        description: "Menu berhasil dihapus",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus menu",
        variant: "destructive",
      });
    },
  });

  // Update restaurant profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest(`/api/restaurants/${restaurant?.id}`, {
        method: "PATCH",
        body: profileData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/profile"] });
      setIsEditProfileOpen(false);
      toast({
        title: "Profil Diperbarui",
        description: "Profil restoran berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive",
      });
    },
  });

  // Set profile form when restaurant data is loaded
  useEffect(() => {
    if (restaurant) {
      setProfileForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        imageUrl: restaurant.imageUrl || ''
      });
    }
  }, [restaurant]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_order') {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/restaurant"] });
    }
  }, [lastMessage, queryClient]);

  // Handle incoming WebSocket messages for new orders
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_order') {
      // Refresh orders when new order comes in
      queryClient.invalidateQueries({ queryKey: ["/api/orders/restaurant"] });
      
      // Show toast notification
      toast({
        title: "🔔 Pesanan Baru!",
        description: `Pesanan baru masuk dengan total ${lastMessage.data?.totalAmount || 0}`,
        duration: 5000,
      });
    }
  }, [lastMessage, queryClient, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Dikonfirmasi';
      case 'preparing': return 'Sedang Dipersiapkan';
      case 'ready': return 'Siap Diambil';
      case 'picked_up': return 'Sedang Diantar';
      case 'delivered': return 'Berhasil Diantar';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  // Calculate statistics
  const todayOrders = orders.filter((order: any) => {
    const today = new Date().toDateString();
    return new Date(order.createdAt).toDateString() === today;
  });

  const todayRevenue = todayOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter((order: any) => order.status === 'pending');

  if (!user || user.role !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
            <p className="text-gray-600 mb-4">Halaman ini khusus untuk pemilik restoran</p>
            <Button onClick={() => window.location.href = '/restaurant/login'}>
              Login sebagai Restoran
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Restoran</h1>
              <p className="text-gray-600">{restaurant?.name || 'Loading...'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="w-3 h-3 mr-1" />
                  {pendingOrders.length} pesanan baru
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pesanan Hari Ini</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayOrders.length}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingOrders.length} menunggu konfirmasi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Rata-rata {formatCurrency(todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  Semua waktu
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8</div>
                <p className="text-xs text-muted-foreground">
                  Dari 150+ ulasan
                </p>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Manajemen Pesanan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
                    <p className="text-gray-600">Pesanan akan muncul di sini saat ada pelanggan yang memesan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Pesanan #{order.id}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Informasi Pelanggan
                            </h4>
                            <p className="text-sm text-gray-600">ID: {order.customerId}</p>
                            <p className="text-sm text-gray-600">Pembayaran: {order.paymentMethod}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Alamat Pengiriman
                            </h4>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Total Pesanan
                            </h4>
                            <p className="text-lg font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-sm text-gray-600">
                              Ongkir: {formatCurrency(order.deliveryFee)}
                            </p>
                          </div>
                        </div>

                        {order.customerNotes && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium mb-1">Catatan Pelanggan:</h4>
                            <p className="text-sm">{order.customerNotes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                                disabled={updateOrderStatusMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Terima Pesanan
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                                disabled={updateOrderStatusMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Tolak Pesanan
                              </Button>
                            </>
                          )}

                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'preparing' })}
                              disabled={updateOrderStatusMutation.isPending}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Mulai Persiapan
                            </Button>
                          )}

                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                              disabled={updateOrderStatusMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Siap Diambil
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Pesanan</span>
                      <span className="font-bold">{orders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pesanan Hari Ini</span>
                      <span className="font-bold">{todayOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pesanan Selesai</span>
                      <span className="font-bold">
                        {orders.filter((o: any) => o.status === 'delivered').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pesanan Dibatalkan</span>
                      <span className="font-bold text-red-600">
                        {orders.filter((o: any) => o.status === 'cancelled').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pendapatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Hari Ini</span>
                      <span className="font-bold">{formatCurrency(todayRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Pendapatan</span>
                      <span className="font-bold">
                        {formatCurrency(orders.reduce((sum: number, order: any) => 
                          order.status === 'delivered' ? sum + order.totalAmount : sum, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rata-rata per Pesanan</span>
                      <span className="font-bold">
                        {formatCurrency(orders.length > 0 ? 
                          orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0) / orders.length : 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manajemen Menu</CardTitle>
                <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Menu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tambah Menu Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      addMenuItemMutation.mutate(menuForm);
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nama Menu</Label>
                        <Input
                          id="name"
                          value={menuForm.name}
                          onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                          id="description"
                          value={menuForm.description}
                          onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Harga</Label>
                          <Input
                            id="price"
                            type="number"
                            value={menuForm.price}
                            onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="prepTime">Waktu Persiapan (menit)</Label>
                          <Input
                            id="prepTime"
                            type="number"
                            value={menuForm.prepTime}
                            onChange={(e) => setMenuForm({...menuForm, prepTime: e.target.value})}
                            placeholder="15"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="categoryId">Kategori</Label>
                        <select
                          id="categoryId"
                          value={menuForm.categoryId}
                          onChange={(e) => setMenuForm({...menuForm, categoryId: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        >
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="imageUrl">URL Gambar</Label>
                        <Input
                          id="imageUrl"
                          value={menuForm.imageUrl}
                          onChange={(e) => setMenuForm({...menuForm, imageUrl: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="ingredients">Bahan-bahan (pisahkan dengan koma)</Label>
                        <Input
                          id="ingredients"
                          value={menuForm.ingredients}
                          onChange={(e) => setMenuForm({...menuForm, ingredients: e.target.value})}
                          placeholder="Daging sapi, bawang, tomat"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          type="submit" 
                          disabled={addMenuItemMutation.isPending}
                        >
                          {addMenuItemMutation.isPending ? "Menambahkan..." : "Tambah Menu"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddMenuOpen(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {menuLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Menu</h3>
                    <p className="text-gray-600 mb-4">Tambahkan menu untuk restoran Anda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map((item: any) => (
                      <Card key={item.id} className="overflow-hidden">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <Badge variant="secondary">
                              {categories.find((c: any) => c.id === item.categoryId)?.name || 'Kategori'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xl font-bold text-primary">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {item.prepTime} menit
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteMenuItemMutation.mutate(item.id)}
                              disabled={deleteMenuItemMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profil Restoran</CardTitle>
                <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edit Profil Restoran</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      updateProfileMutation.mutate(profileForm);
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="profileName">Nama Restoran</Label>
                        <Input
                          id="profileName"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="profileDescription">Deskripsi</Label>
                        <Textarea
                          id="profileDescription"
                          value={profileForm.description}
                          onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="profileAddress">Alamat</Label>
                        <Textarea
                          id="profileAddress"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="profilePhone">Telepon</Label>
                        <Input
                          id="profilePhone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="profileImageUrl">URL Gambar Restoran</Label>
                        <Input
                          id="profileImageUrl"
                          value={profileForm.imageUrl}
                          onChange={(e) => setProfileForm({...profileForm, imageUrl: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditProfileOpen(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {restaurant ? (
                  <div className="space-y-6">
                    {/* Restaurant Image */}
                    {restaurant.imageUrl && (
                      <div className="text-center">
                        <img 
                          src={restaurant.imageUrl} 
                          alt={restaurant.name}
                          className="w-48 h-32 object-cover rounded-lg mx-auto mb-4"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nama Restoran</label>
                          <p className="text-lg font-semibold">{restaurant.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Deskripsi</label>
                          <p className="text-sm">{restaurant.description || "Belum ada deskripsi"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className="flex items-center mt-1">
                            <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                              {restaurant.isActive ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Alamat</label>
                          <p className="text-sm">{restaurant.address}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Telepon</label>
                          <p className="text-sm">{restaurant.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Rating</label>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{restaurant.rating}</span>
                            <span className="text-sm text-gray-500 ml-2">({restaurant.totalOrders} pesanan)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat profil restoran...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}