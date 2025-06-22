import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/photo-upload";
import { 
  Car, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Phone,
  CheckCircle,
  Play,
  Square,
  Navigation,
  Home,
  Package,
  Wallet,
  Settings,
  Power,
  UserCheck,
  Route,
  Target,
  Timer,
  Edit,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Filter,
  TrendingUp,
  Calendar,
  Star
} from "lucide-react";

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [driverOnline, setDriverOnline] = useState(false);
  const [activeTab, setActiveTab] = useState("beranda");
  const [orderFilter, setOrderFilter] = useState("all");
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    photoFile: null as File | null,
    photoPreview: null as string | null
  });
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    earnings: true,
    promotions: false
  });

  const [workingHours, setWorkingHours] = useState({
    start: '06:00',
    end: '22:00',
    breakStart: '12:00',
    breakEnd: '13:00'
  });

  const [locationSettings, setLocationSettings] = useState({
    shareLocation: true,
    preciseLocation: true,
    workingRadius: 5
  });

  const [walletPin, setWalletPin] = useState('');
  const [showWalletHistory, setShowWalletHistory] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [pinData, setPinData] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders/driver", user?.id],
    queryFn: () => fetch(`/api/orders/driver?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  const { data: driverData } = useQuery({
    queryKey: ["/api/drivers/me", user?.id],
    queryFn: () => fetch(`/api/drivers/me?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  const { data: walletData } = useQuery({
    queryKey: ["/api/drivers/wallet", user?.id],
    queryFn: () => fetch(`/api/drivers/wallet?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  const { data: earningsStats } = useQuery({
    queryKey: ["/api/drivers/earnings/stats", user?.id],
    queryFn: () => fetch(`/api/drivers/earnings/stats?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/driver"] });
      toast({ title: "Status pesanan berhasil diperbarui" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await fetch('/api/drivers/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...data, userId: user?.id })
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/me", user?.id] });
      toast({ title: "Profil berhasil diperbarui" });
      setEditProfile(false);
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/drivers/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...settings, userId: user?.id })
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Pengaturan berhasil diperbarui" });
    }
  });

  const updateDriverStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const response = await fetch('/api/drivers/status', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isOnline, userId: user?.id })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/me", user?.id] });
      toast({ 
        title: data.message,
        description: `Status kerja berubah menjadi ${data.isOnline ? 'ONLINE' : 'OFFLINE'}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Gagal mengubah status", 
        description: error.message,
        variant: "destructive" 
      });
      // Revert local state if API call fails
      setDriverOnline(!driverOnline);
    }
  });

  const changePinMutation = useMutation({
    mutationFn: async (data: { currentPin: string; newPin: string }) => {
      const response = await fetch('/api/drivers/change-pin', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...data, userId: user?.id })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      setShowChangePinModal(false);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
    },
    onError: (error: any) => {
      toast({ title: error.message, variant: "destructive" });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('/api/drivers/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...data, userId: user?.id })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      setShowChangePasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({ title: error.message, variant: "destructive" });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/drivers/withdraw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({ 
          amount, 
          userId: user?.id || 7,
          bankAccount: "1234567890",
          bankName: "Bank BCA",
          accountHolder: user?.name || "Tatang"
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to withdraw');
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/me", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/earnings/stats", user?.id] });
      toast({ 
        title: "Penarikan Berhasil", 
        description: `${data.message} - ID: ${data.withdrawalId}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Gagal Menarik Saldo", 
        description: error.message || "Terjadi kesalahan saat memproses penarikan",
        variant: "destructive" 
      });
    }
  });

  const activeOrder = orders.find(order => 
    ['confirmed', 'preparing', 'ready', 'pickup'].includes(order.status)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-yellow-400';
      case 'pickup': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'confirmed': return { text: 'Terima Order', next: 'preparing' };
      case 'preparing': return { text: 'Sudah Tiba', next: 'ready' };
      case 'ready': return { text: 'Mulai Perjalanan', next: 'pickup' };
      case 'pickup': return { text: 'Selesai', next: 'delivered' };
      default: return { text: 'Proses', next: 'confirmed' };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'completed') return order.status === 'delivered';
    if (orderFilter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const todayEarnings = orders
    .filter(o => o.status === 'delivered' && 
      new Date(o.deliveredAt || '').toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  const handleWithdraw = () => {
    const amount = driverData?.totalEarnings || 0;
    if (amount > 0) {
      withdrawMutation.mutate(amount);
    } else {
      toast({ title: "Saldo tidak mencukupi", variant: "destructive" });
    }
  };

  const handleProfileSave = () => {
    if (!profileData.name.trim()) {
      toast({ title: "Nama tidak boleh kosong", variant: "destructive" });
      return;
    }
    if (!profileData.phone.trim()) {
      toast({ title: "Nomor telepon tidak boleh kosong", variant: "destructive" });
      return;
    }
    if (!profileData.vehicleType) {
      toast({ title: "Jenis kendaraan harus dipilih", variant: "destructive" });
      return;
    }
    if (!profileData.vehicleNumber.trim()) {
      toast({ title: "Nomor polisi tidak boleh kosong", variant: "destructive" });
      return;
    }
    
    updateProfileMutation.mutate(profileData);
  };

  // Initialize profile data when component mounts or user data changes
  useEffect(() => {
    if (user && driverData) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        vehicleType: driverData.vehicleType || '',
        vehicleNumber: driverData.vehicleNumber || ''
      });
    }
  }, [user, driverData]);

  // Sync driver online status with database
  useEffect(() => {
    if (driverData?.isOnline !== undefined) {
      setDriverOnline(driverData.isOnline);
    }
  }, [driverData?.isOnline]);

  // Auto-refresh driver data when online status changes
  useEffect(() => {
    if (driverData?.isOnline !== undefined) {
      setDriverOnline(driverData.isOnline);
    }
  }, [driverData?.isOnline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white text-gray-800">
      {/* Header dengan Profil Driver */}
      <div className="bg-gradient-to-r from-orange-200 to-white shadow-lg border-b border-orange-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-r from-orange-300 to-orange-200 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-gray-700" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-700">{user?.name || 'Driver'}</h2>
              <p className="text-sm text-orange-500">ID: #{user?.id}</p>
            </div>
          </div>
          
          {/* Status Online/Offline */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Status</p>
              <p className={`text-sm font-bold ${driverOnline ? 'text-orange-500' : 'text-gray-400'}`}>
                {driverOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
            <Button
              onClick={() => {
                const newStatus = !driverOnline;
                setDriverOnline(newStatus);
                updateDriverStatusMutation.mutate(newStatus);
              }}
              disabled={updateDriverStatusMutation.isPending}
              className={`w-12 h-12 rounded-full shadow-lg ${
                driverOnline 
                  ? 'bg-orange-300 hover:bg-orange-400 text-gray-700' 
                  : 'bg-orange-400 hover:bg-orange-500 text-white'
              }`}
            >
              <Power className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Saldo & Stats */}
        <div className="grid grid-cols-3 gap-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">SALDO AKTIF</p>
            <p className="font-bold text-orange-500">{formatCurrency(driverData?.totalEarnings || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">RATING</p>
            <p className="font-bold text-gray-700">{driverData?.rating || 5.0} ⭐</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">STATUS</p>
            <p className={`font-bold text-xs ${driverOnline ? 'text-orange-500' : 'text-gray-400'}`}>
              {driverOnline ? 'ONLINE' : 'OFFLINE'}
            </p>
          </div>
        </div>
        
        {/* Real-time Status Indicator */}
        <div className="mt-2 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${driverOnline ? 'bg-orange-400 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-500">
            {driverOnline ? 'Siap menerima pesanan' : 'Tidak menerima pesanan'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 pb-20">
        {/* Tab Content */}
        {activeTab === "beranda" && (
          <>
            {/* Detail Pesanan Aktif */}
            {activeOrder ? (
              <div className="space-y-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-700">Pesanan Aktif</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(activeOrder.status)} text-white`}>
                      {activeOrder.status === 'confirmed' ? 'MENUNGGU' :
                       activeOrder.status === 'preparing' ? 'DISIAPKAN' :
                       activeOrder.status === 'ready' ? 'SIAP AMBIL' :
                       activeOrder.status === 'pickup' ? 'DIANTAR' : activeOrder.status}
                    </div>
                  </div>

                  {/* Penjemputan */}
                  <div className="bg-orange-50 rounded-lg p-3 mb-3 border border-orange-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-orange-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">TITIK PENJEMPUTAN</p>
                        <p className="text-sm font-medium text-gray-700">{activeOrder.restaurantAddress}</p>
                        <p className="text-xs text-gray-500 mt-1">Restoran</p>
                      </div>
                    </div>
                  </div>

                  {/* Tujuan */}
                  <div className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">TUJUAN</p>
                        <p className="text-sm font-medium text-gray-700">{activeOrder.deliveryAddress}</p>
                        <p className="text-xs text-gray-500 mt-1">Customer #{activeOrder.customerId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Detail */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
                      <p className="text-xs text-gray-500">ESTIMASI TARIF</p>
                      <p className="text-lg font-bold text-orange-500">{formatCurrency(activeOrder.deliveryFee)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
                      <p className="text-xs text-gray-500">JARAK TEMPUH</p>
                      <p className="text-lg font-bold text-gray-700">~3.2 km</p>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => updateOrderMutation.mutate({ 
                        orderId: activeOrder.id, 
                        status: getNextAction(activeOrder.status).next 
                      })}
                      className="w-full bg-gradient-to-r from-orange-400 to-orange-300 hover:from-orange-500 hover:to-orange-400 text-gray-700 font-bold py-3 shadow-lg"
                    >
                      {getNextAction(activeOrder.status).text}
                    </Button>
                    
                    {activeOrder.status !== 'confirmed' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="border-orange-200 text-orange-500 hover:bg-orange-50">
                          <Phone className="w-4 h-4 mr-2" />
                          Hubungi
                        </Button>
                        <Button variant="outline" className="border-orange-200 text-orange-500 hover:bg-orange-50">
                          <Navigation className="w-4 h-4 mr-2" />
                          Navigasi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Peta Placeholder */}
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 h-48 flex items-center justify-center shadow-lg border border-orange-100">
                  <div className="text-center">
                    <Route className="w-12 h-12 text-orange-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm font-medium">Peta Rute & Navigasi</p>
                    <p className="text-xs text-gray-500">Jalur optimal ke tujuan</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg border border-orange-100">
                <Target className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2 text-gray-700">
                  {driverOnline ? 'Menunggu Pesanan' : 'Status Offline'}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {driverOnline 
                    ? 'Anda sedang online. Pesanan baru akan muncul di sini.' 
                    : 'Aktifkan status online untuk mulai menerima pesanan.'
                  }
                </p>
                {!driverOnline && (
                  <Button 
                    onClick={() => {
                      setDriverOnline(true);
                      updateDriverStatusMutation.mutate(true);
                    }}
                    className="bg-gradient-to-r from-orange-400 to-orange-300 hover:from-orange-500 hover:to-orange-400 text-gray-700 font-bold shadow-lg"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Mulai Online
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab Order */}
        {activeTab === "order" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-700">Riwayat Pesanan</h3>
              <Filter className="w-5 h-5 text-orange-400" />
            </div>
            
            {/* Filter Status */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={orderFilter === 'all' ? 'default' : 'outline'} 
                className={`text-xs ${orderFilter === 'all' ? 'bg-orange-300 text-gray-700' : 'border-orange-200 text-orange-500'}`}
                onClick={() => setOrderFilter('all')}
              >
                Semua ({orders.length})
              </Button>
              <Button 
                variant={orderFilter === 'completed' ? 'default' : 'outline'} 
                className={`text-xs ${orderFilter === 'completed' ? 'bg-orange-300 text-gray-700' : 'border-orange-200 text-orange-500'}`}
                onClick={() => setOrderFilter('completed')}
              >
                Selesai ({orders.filter(o => o.status === 'delivered').length})
              </Button>
              <Button 
                variant={orderFilter === 'cancelled' ? 'default' : 'outline'} 
                className={`text-xs ${orderFilter === 'cancelled' ? 'bg-orange-300 text-gray-700' : 'border-orange-200 text-orange-500'}`}
                onClick={() => setOrderFilter('cancelled')}
              >
                Dibatalkan ({orders.filter(o => o.status === 'cancelled').length})
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center shadow-lg border border-orange-100">
                <p className="text-2xl font-bold text-orange-500">{orders.filter(o => o.status === 'delivered').length}</p>
                <p className="text-xs text-gray-500">Total Selesai</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center shadow-lg border border-orange-100">
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(todayEarnings)}</p>
                <p className="text-xs text-gray-500">Hari Ini</p>
              </div>
            </div>

            {/* List Order */}
            <div className="space-y-3">
              {filteredOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Order #{order.id}</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)} text-white`}>
                      {order.status === 'delivered' ? 'SELESAI' :
                       order.status === 'cancelled' ? 'DIBATALKAN' :
                       order.status.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">📍 {order.deliveryAddress}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-500 font-bold">{formatCurrency(order.deliveryFee || 0)}</span>
                      {order.status === 'delivered' && (
                        <Star className="w-3 h-3 text-orange-400" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : ''}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredOrders.length === 0 && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg border border-orange-100">
                  <Package className="w-12 h-12 text-orange-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {orderFilter === 'all' ? 'Belum ada riwayat pesanan' :
                     orderFilter === 'completed' ? 'Belum ada pesanan selesai' :
                     'Belum ada pesanan dibatalkan'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Dompet */}
        {activeTab === "dompet" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-700">Dompet Driver</h3>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            
            {/* Saldo */}
            <div className="bg-gradient-to-r from-orange-300 to-orange-200 rounded-lg p-6 text-gray-700 shadow-lg border border-orange-100">
              <div className="text-center">
                <p className="text-sm font-medium opacity-80">TOTAL PENDAPATAN</p>
                <p className="text-3xl font-bold">{formatCurrency(driverData?.totalEarnings || 0)}</p>
                <p className="text-xs opacity-70 mt-1">Saldo dapat dicairkan</p>
                <div className="flex items-center justify-center mt-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-xs font-medium">Aktif</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                disabled={false}
                className="bg-white/90 text-gray-700 border border-orange-100 h-16 flex flex-col hover:bg-orange-50 shadow-lg"
              >
                <DollarSign className="w-6 h-6 mb-1 text-orange-400" />
                <span className="text-xs">
                  Tarik Saldo
                </span>
              </Button>
              <Button 
                onClick={() => setShowWalletHistory(!showWalletHistory)}
                className="bg-white/90 text-gray-700 border border-orange-100 h-16 flex flex-col hover:bg-orange-50 shadow-lg"
              >
                <Clock className="w-6 h-6 mb-1 text-orange-400" />
                <span className="text-xs">Riwayat</span>
              </Button>
            </div>

            {/* Withdraw Form */}
            {showWithdrawForm && (
              <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
                <h4 className="font-medium text-gray-700 mb-3">Formulir Penarikan Saldo</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Jumlah Penarikan</Label>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-white border-orange-200 text-gray-700 mt-1"
                      placeholder="Minimal Rp 50.000"
                      min="50000"
                      max={driverData?.totalEarnings || 0}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Saldo tersedia: {formatCurrency(driverData?.totalEarnings || 0)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-orange-200 text-orange-500 text-xs"
                      onClick={() => setWithdrawAmount('100000')}
                    >
                      100K
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-orange-200 text-orange-500 text-xs"
                      onClick={() => setWithdrawAmount('500000')}
                    >
                      500K
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-orange-200 text-orange-500 text-xs"
                      onClick={() => setWithdrawAmount(String(driverData?.totalEarnings || 0))}
                    >
                      Semua
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawAmount('');
                    }}
                    variant="outline" 
                    className="flex-1 border-orange-200 text-gray-600"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={() => {
                      const amount = Number(withdrawAmount);
                      if (amount >= 50000) {
                        withdrawMutation.mutate(amount);
                        setWithdrawAmount('');
                        setShowWithdrawForm(false);
                      } else {
                        toast({ 
                          title: "Jumlah tidak valid", 
                          description: "Minimal Rp 50.000",
                          variant: "destructive" 
                        });
                      }
                    }}
                    disabled={withdrawMutation.isPending || !withdrawAmount || Number(withdrawAmount) < 50000}
                    className="flex-1 bg-orange-300 hover:bg-orange-400 text-gray-700"
                  >
                    {withdrawMutation.isPending ? 'Memproses...' : 'Tarik Saldo'}
                  </Button>
                </div>
              </div>
            )}

            {/* Transaction History */}
            {showWalletHistory && (
              <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
                <h4 className="font-medium mb-3 text-gray-700">Riwayat Transaksi</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {earningsStats?.transactions?.map((transaction: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded border border-orange-100">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {transaction.type === 'delivery' ? 'Pengantaran' :
                           transaction.type === 'bonus' ? 'Bonus' :
                           transaction.type === 'withdrawal' ? 'Penarikan' : 'Transaksi'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('id-ID') : ''}
                        </p>
                      </div>
                      <span className={`font-bold ${transaction.amount > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">Belum ada riwayat transaksi</p>
                  )}
                </div>
              </div>
            )}

            {/* Statistik Mingguan */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <h4 className="font-medium mb-3 flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-orange-400" />
                Statistik Pendapatan
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-500">
                    {formatCurrency(earningsStats?.today || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Hari Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-400">
                    {formatCurrency(earningsStats?.week || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Minggu Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-300">
                    {formatCurrency(earningsStats?.month || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Bulan Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(earningsStats?.total || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>

            {/* Tips Earnings */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <h4 className="font-medium mb-2 text-gray-700">💡 Tips Meningkatkan Pendapatan</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Tetap online di jam sibuk (11:00-14:00, 18:00-21:00)</p>
                <p>• Jaga rating dengan pelayanan terbaik</p>
                <p>• Aktifkan notifikasi untuk pesanan baru</p>
                <p>• Selesaikan pengantaran dengan cepat dan akurat</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Profil */}
        {activeTab === "profil" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-700">Profil Driver</h3>
              <Edit className="w-5 h-5 text-orange-400" />
            </div>
            
            {/* Profile Card */}
            <div className="bg-white/95 rounded-lg p-6 shadow-lg border border-orange-100">
              {!editProfile ? (
                <>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-orange-300 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-700">{user?.name || 'Driver'}</h4>
                      <p className="text-gray-500 text-sm">ID: #{user?.id}</p>
                      <p className="text-gray-500 text-sm">📱 {user?.phone || profileData.phone || 'Belum diatur'}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-orange-400 mr-1">⭐</span>
                        <span className="text-sm text-gray-700">{driverData?.rating || 5.0}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          ({driverData?.totalDeliveries || 0} pengantaran)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Info */}
                  <div className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-100">
                    <h5 className="font-medium text-sm mb-2 text-gray-700">Informasi Kendaraan</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Jenis</span>
                        <span className="text-gray-700">{driverData?.vehicleType || profileData.vehicleType || 'Belum diatur'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nomor Polisi</span>
                        <span className="text-gray-700">{driverData?.vehicleNumber || profileData.vehicleNumber || 'Belum diatur'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setProfileData({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        vehicleType: driverData?.vehicleType || '',
                        vehicleNumber: driverData?.vehicleNumber || ''
                      });
                      setEditProfile(true);
                    }}
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profil
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Edit Informasi Profil</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Nama Lengkap</Label>
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="bg-white border-orange-200 text-gray-700"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Nomor Telepon</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="bg-white border-orange-200 text-gray-700"
                        placeholder="08123456789"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Jenis Kendaraan</Label>
                      <select 
                        value={profileData.vehicleType}
                        onChange={(e) => setProfileData({...profileData, vehicleType: e.target.value})}
                        className="w-full p-2 bg-white border border-orange-200 text-gray-700 rounded"
                      >
                        <option value="">Pilih jenis kendaraan</option>
                        <option value="motorcycle">Motor</option>
                        <option value="car">Mobil</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Nomor Polisi</Label>
                      <Input
                        value={profileData.vehicleNumber}
                        onChange={(e) => setProfileData({...profileData, vehicleNumber: e.target.value})}
                        className="bg-white border-orange-200 text-gray-700"
                        placeholder="B 1234 CD"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Foto Profil</Label>
                      <PhotoUpload
                        onPhotoChange={(file, preview) => 
                          setProfileData({...profileData, photoFile: file, photoPreview: preview})
                        }
                        currentPhoto={profileData.photoPreview}
                        placeholder="Upload foto profil"
                        maxSize={2}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      onClick={() => setEditProfile(false)}
                      variant="outline" 
                      className="flex-1 border-orange-200 text-orange-500 hover:bg-orange-50"
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={handleProfileSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-orange-400 to-orange-300 hover:from-orange-500 hover:to-orange-400 text-gray-700"
                    >
                      {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-100">
              <h4 className="font-medium mb-3 text-gray-700">Performa Driver</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-orange-50 border border-orange-100 rounded">
                  <p className="text-2xl font-bold text-orange-500">{driverData?.rating || 5.0}</p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
                <div className="text-center p-3 bg-orange-50 border border-orange-100 rounded">
                  <p className="text-2xl font-bold text-orange-400">{driverData?.totalDeliveries || 0}</p>
                  <p className="text-xs text-gray-600">Total Antar</p>
                </div>
                <div className="text-center p-3 bg-orange-50 border border-orange-100 rounded">
                  <p className="text-2xl font-bold text-orange-300">
                    {orders.filter(o => o.status === 'delivered').length || 0}
                  </p>
                  <p className="text-xs text-gray-600">Bulan Ini</p>
                </div>
                <div className="text-center p-3 bg-orange-50 border border-orange-100 rounded">
                  <p className={`text-2xl font-bold ${driverData?.isOnline ? 'text-orange-500' : 'text-gray-400'}`}>
                    {driverData?.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </p>
                  <p className="text-xs text-gray-600">Status</p>
                </div>
              </div>
            </div>

            {/* Status & Verification */}
            <div className="space-y-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Status Verifikasi</span>
                  <CheckCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="text-gray-600">📄 KTP</span>
                    <span className="text-orange-500 font-medium">✓ Terverifikasi</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="text-gray-600">🪪 SIM</span>
                    <span className="text-orange-500 font-medium">✓ Terverifikasi</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="text-gray-600">📋 STNK</span>
                    <span className="text-orange-500 font-medium">✓ Terverifikasi</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="text-gray-600">📷 Foto Profil</span>
                    <span className="text-orange-500 font-medium">✓ Terverifikasi</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Semua dokumen telah diverifikasi oleh sistem
                </p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-orange-400" />
                  <div>
                    <span className="block text-gray-700">Kontak Darurat</span>
                    <span className="text-xs text-gray-500">+62 812-3456-7890</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
                  Edit
                </Button>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <div>
                    <span className="block text-gray-800">Alamat Rumah</span>
                    <span className="text-xs text-gray-600">Jl. Merdeka No. 123, Tasikmalaya</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Pengaturan */}
        {activeTab === "pengaturan" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-700">Pengaturan</h3>
              <Settings className="w-5 h-5 text-orange-400" />
            </div>
            
            {/* Notification Settings */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-orange-400 mr-2" />
                <h4 className="font-medium text-gray-700">Notifikasi</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Pesanan Baru</span>
                    <p className="text-xs text-gray-500">Terima notifikasi pesanan masuk</p>
                  </div>
                  <Switch 
                    checked={notifications.orderUpdates}
                    onCheckedChange={(checked) => {
                      setNotifications({...notifications, orderUpdates: checked});
                      updateSettingsMutation.mutate({ notifications: {...notifications, orderUpdates: checked} });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Update Pendapatan</span>
                    <p className="text-xs text-gray-500">Notifikasi saldo dan penarikan</p>
                  </div>
                  <Switch 
                    checked={notifications.earnings}
                    onCheckedChange={(checked) => {
                      setNotifications({...notifications, earnings: checked});
                      updateSettingsMutation.mutate({ notifications: {...notifications, earnings: checked} });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Promosi & Bonus</span>
                    <p className="text-xs text-gray-500">Info promo dan reward khusus</p>
                  </div>
                  <Switch 
                    checked={notifications.promotions}
                    onCheckedChange={(checked) => {
                      setNotifications({...notifications, promotions: checked});
                      updateSettingsMutation.mutate({ notifications: {...notifications, promotions: checked} });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-orange-400 mr-2" />
                <h4 className="font-medium text-gray-700">Jam Kerja</h4>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Mulai Kerja</Label>
                    <Input
                      type="time"
                      value={workingHours.start}
                      onChange={(e) => {
                        const newHours = {...workingHours, start: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-white border-orange-200 text-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Selesai Kerja</Label>
                    <Input
                      type="time"
                      value={workingHours.end}
                      onChange={(e) => {
                        const newHours = {...workingHours, end: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-white border-orange-200 text-gray-700 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Istirahat Mulai</Label>
                    <Input
                      type="time"
                      value={workingHours.breakStart}
                      onChange={(e) => {
                        const newHours = {...workingHours, breakStart: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-white border-orange-200 text-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Istirahat Selesai</Label>
                    <Input
                      type="time"
                      value={workingHours.breakEnd}
                      onChange={(e) => {
                        const newHours = {...workingHours, breakEnd: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-white border-orange-200 text-gray-700 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-orange-400 mr-2" />
                <h4 className="font-medium text-gray-700">Lokasi & Privasi</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Bagikan Lokasi</span>
                    <p className="text-xs text-gray-500">Untuk pelacakan pesanan real-time</p>
                  </div>
                  <Switch 
                    checked={locationSettings.shareLocation}
                    onCheckedChange={(checked) => {
                      const newSettings = {...locationSettings, shareLocation: checked};
                      setLocationSettings(newSettings);
                      updateSettingsMutation.mutate({ location: newSettings });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Lokasi Presisi Tinggi</span>
                    <p className="text-xs text-gray-500">GPS akurat untuk navigasi</p>
                  </div>
                  <Switch 
                    checked={locationSettings.preciseLocation}
                    onCheckedChange={(checked) => {
                      const newSettings = {...locationSettings, preciseLocation: checked};
                      setLocationSettings(newSettings);
                      updateSettingsMutation.mutate({ location: newSettings });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Radius Kerja (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={locationSettings.workingRadius}
                    onChange={(e) => {
                      const newSettings = {...locationSettings, workingRadius: Number(e.target.value)};
                      setLocationSettings(newSettings);
                      updateSettingsMutation.mutate({ location: newSettings });
                    }}
                    className="bg-white border-orange-200 text-gray-700 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-orange-400 mr-2" />
                <h4 className="font-medium text-gray-700">Keamanan</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-100">
                  <div>
                    <span className="text-sm text-gray-700">Ubah PIN Dompet</span>
                    <p className="text-xs text-gray-500">PIN untuk transaksi dompet</p>
                  </div>
                  <Button 
                    onClick={() => setShowChangePinModal(true)}
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-500 hover:bg-orange-100"
                  >
                    Ubah
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-100">
                  <div>
                    <span className="text-sm text-gray-700">Ubah Password</span>
                    <p className="text-xs text-gray-500">Password login akun</p>
                  </div>
                  <Button 
                    onClick={() => setShowChangePasswordModal(true)}
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-500 hover:bg-orange-100"
                  >
                    Ubah
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-100">
                  <div>
                    <span className="text-sm text-gray-700">Autentikasi 2 Faktor</span>
                    <p className="text-xs text-gray-500">Keamanan ekstra dengan SMS</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <div className="flex items-center mb-4">
                <HelpCircle className="w-5 h-5 text-orange-400 mr-2" />
                <h4 className="font-medium text-gray-700">Bantuan & Dukungan</h4>
              </div>
              
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-orange-50">
                  <span>Pusat Bantuan</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-orange-50">
                  <span>Chat dengan CS</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-orange-50">
                  <span>Lapor Masalah</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-orange-50">
                  <span>Syarat & Ketentuan</span>
                </Button>
              </div>
            </div>

            {/* Status Driver */}
            <div className="bg-white/95 rounded-lg p-4 shadow-lg border border-orange-100">
              <h4 className="font-medium mb-3 text-gray-700">Status Driver</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-orange-50 rounded border border-orange-100">
                  <p className="text-lg font-bold text-orange-500">AKTIF</p>
                  <p className="text-xs text-gray-500">Status Akun</p>
                </div>
                <div className="p-3 bg-orange-50 rounded border border-orange-100">
                  <p className={`text-lg font-bold ${driverOnline ? 'text-orange-500' : 'text-gray-400'}`}>
                    {driverOnline ? 'ONLINE' : 'OFFLINE'}
                  </p>
                  <p className="text-xs text-gray-500">Status Kerja</p>
                </div>
              </div>
              
              {/* Status Info */}
              <div className="mt-3 text-xs text-gray-500 text-center">
                <p>Status tersinkron otomatis dengan header dan tersimpan real-time</p>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4">
              <Button 
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('token');
                  window.location.href = '/driver/login';
                }}
                variant="destructive" 
                className="w-full bg-red-400 hover:bg-red-500 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar dari Akun
              </Button>
            </div>

            {/* App Info */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">FoodieID Driver v1.0.0</p>
              <p className="text-xs text-gray-500">© 2025 TasFood Indonesia</p>
              <p className="text-xs text-gray-600 mt-1">Build 20250621</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ubah PIN */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-orange-100">
            <h3 className="font-bold text-lg mb-4 text-gray-700">Ubah PIN Dompet</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">PIN Lama</Label>
                <Input
                  type="password"
                  value={pinData.currentPin}
                  onChange={(e) => setPinData({...pinData, currentPin: e.target.value})}
                  className="bg-white border-orange-200 text-gray-700"
                  placeholder="Masukkan PIN lama (6 digit)"
                  maxLength={6}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">PIN Baru</Label>
                <Input
                  type="password"
                  value={pinData.newPin}
                  onChange={(e) => setPinData({...pinData, newPin: e.target.value})}
                  className="bg-white border-orange-200 text-gray-700"
                  placeholder="Masukkan PIN baru (6 digit)"
                  maxLength={6}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Konfirmasi PIN Baru</Label>
                <Input
                  type="password"
                  value={pinData.confirmPin}
                  onChange={(e) => setPinData({...pinData, confirmPin: e.target.value})}
                  className="bg-white border-orange-200 text-gray-700"
                  placeholder="Ulangi PIN baru"
                  maxLength={6}
                />
              </div>
              
              {pinData.newPin && pinData.confirmPin && pinData.newPin !== pinData.confirmPin && (
                <p className="text-red-500 text-xs">PIN baru tidak cocok</p>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={() => {
                    setShowChangePinModal(false);
                    setPinData({ currentPin: '', newPin: '', confirmPin: '' });
                  }}
                  variant="outline" 
                  className="flex-1 border-orange-200 text-orange-500"
                >
                  Batal
                </Button>
                <Button 
                  onClick={() => {
                    if (!pinData.currentPin || !pinData.newPin || !pinData.confirmPin) {
                      toast({ title: "Semua field harus diisi", variant: "destructive" });
                      return;
                    }
                    if (pinData.newPin !== pinData.confirmPin) {
                      toast({ title: "PIN baru tidak cocok", variant: "destructive" });
                      return;
                    }
                    if (pinData.newPin.length !== 6 || !/^\d{6}$/.test(pinData.newPin)) {
                      toast({ title: "PIN harus 6 digit angka", variant: "destructive" });
                      return;
                    }
                    changePinMutation.mutate({
                      currentPin: pinData.currentPin,
                      newPin: pinData.newPin
                    });
                  }}
                  disabled={changePinMutation.isPending || !pinData.currentPin || !pinData.newPin || !pinData.confirmPin || pinData.newPin !== pinData.confirmPin}
                  className="flex-1 bg-orange-300 hover:bg-orange-400 text-gray-700"
                >
                  {changePinMutation.isPending ? 'Mengubah...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Password */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-orange-100">
            <h3 className="font-bold text-lg mb-4 text-gray-700">Ubah Password</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Password Lama</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="bg-white border-orange-200 text-gray-700"
                  placeholder="Masukkan password lama"
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Password Baru</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="bg-white border-orange-200 text-gray-700"
                  placeholder="Masukkan password baru (min 6 karakter)"
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Konfirmasi Password Baru</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="bg-white border-orange-200 text-gray-700"
                  placeholder="Ulangi password baru"
                />
              </div>
              
              {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-red-500 text-xs">Password baru tidak cocok</p>
              )}
              
              {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                <p className="text-red-500 text-xs">Password minimal 6 karakter</p>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  variant="outline" 
                  className="flex-1 border-orange-200 text-orange-500"
                >
                  Batal
                </Button>
                <Button 
                  onClick={() => {
                    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                      toast({ title: "Semua field harus diisi", variant: "destructive" });
                      return;
                    }
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      toast({ title: "Password baru tidak cocok", variant: "destructive" });
                      return;
                    }
                    if (passwordData.newPassword.length < 6) {
                      toast({ title: "Password minimal 6 karakter", variant: "destructive" });
                      return;
                    }
                    changePasswordMutation.mutate({
                      currentPassword: passwordData.currentPassword,
                      newPassword: passwordData.newPassword
                    });
                  }}
                  disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
                  className="flex-1 bg-orange-300 hover:bg-orange-400 text-gray-700"
                >
                  {changePasswordMutation.isPending ? 'Mengubah...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-200 to-white border-t border-orange-100 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => setActiveTab("beranda")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "beranda" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Beranda</span>
          </button>
          
          <button
            onClick={() => setActiveTab("order")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "order" ? "text-orange-600" : "text-gray-500"
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-xs font-medium">Order</span>
          </button>
          
          <button
            onClick={() => setActiveTab("dompet")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "dompet" ? "text-orange-600" : "text-gray-500"
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-medium">Dompet</span>
          </button>
          
          <button
            onClick={() => setActiveTab("profil")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "profil" ? "text-orange-600" : "text-gray-500"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profil</span>
          </button>
          
          <button
            onClick={() => setActiveTab("pengaturan")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "pengaturan" ? "text-orange-600" : "text-gray-500"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Pengaturan</span>
          </button>
        </div>
      </div>
    </div>
  );
}