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
  Trash2
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
        <Card>
          <CardContent className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Mitra Restoran</h3>
            <p className="text-gray-600 mb-4">Dashboard lengkap seperti GoBiz dengan 5 fitur utama:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Home className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Beranda</p>
                <p className="text-xs text-gray-600">Statistik & Overview</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Kelola Pesanan</p>
                <p className="text-xs text-gray-600">Real-time order tracking</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <UtensilsCrossed className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Menu Management</p>
                <p className="text-xs text-gray-600">Tambah, edit, toggle menu</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Laporan & Analytics</p>
                <p className="text-xs text-gray-600">Revenue & performance</p>
              </div>
            </div>
            <Button onClick={() => setShowAddMenuModal(true)} className="mt-6">
              <Plus className="w-4 h-4 mr-2" />
              Mulai Kelola Menu
            </Button>
          </CardContent>
        </Card>
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
