import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
    vehicleNumber: ''
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

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/drivers/withdraw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount, userId: user?.id })
      });
      if (!response.ok) throw new Error('Failed to withdraw');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/me", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/earnings/stats", user?.id] });
      toast({ title: "Penarikan saldo berhasil diproses" });
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header dengan Profil Driver */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{user?.name || 'Driver'}</h2>
              <p className="text-sm text-gray-400">ID: #{user?.id}</p>
            </div>
          </div>
          
          {/* Status Online/Offline */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Status</p>
              <p className={`text-sm font-bold ${driverOnline ? 'text-green-400' : 'text-red-400'}`}>
                {driverOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
            <Button
              onClick={() => setDriverOnline(!driverOnline)}
              className={`w-12 h-12 rounded-full ${
                driverOnline 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              <Power className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Saldo & Stats */}
        <div className="grid grid-cols-3 gap-4 bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">SALDO AKTIF</p>
            <p className="font-bold text-yellow-400">{formatCurrency(driverData?.totalEarnings || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">RATING</p>
            <p className="font-bold text-white">{driverData?.rating || 5.0} ⭐</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">TOTAL ANTAR</p>
            <p className="font-bold text-white">{driverData?.totalDeliveries || 0}</p>
          </div>
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
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Pesanan Aktif</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(activeOrder.status)} text-gray-900`}>
                      {activeOrder.status === 'confirmed' ? 'MENUNGGU' :
                       activeOrder.status === 'preparing' ? 'DISIAPKAN' :
                       activeOrder.status === 'ready' ? 'SIAP AMBIL' :
                       activeOrder.status === 'pickup' ? 'DIANTAR' : activeOrder.status}
                    </div>
                  </div>

                  {/* Penjemputan */}
                  <div className="bg-gray-700 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 font-medium">TITIK PENJEMPUTAN</p>
                        <p className="text-sm font-medium">{activeOrder.restaurantAddress}</p>
                        <p className="text-xs text-gray-400 mt-1">Restoran</p>
                      </div>
                    </div>
                  </div>

                  {/* Tujuan */}
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 font-medium">TUJUAN</p>
                        <p className="text-sm font-medium">{activeOrder.deliveryAddress}</p>
                        <p className="text-xs text-gray-400 mt-1">Customer #{activeOrder.customerId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Detail */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">ESTIMASI TARIF</p>
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(activeOrder.deliveryFee)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">JARAK TEMPUH</p>
                      <p className="text-lg font-bold text-white">~3.2 km</p>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => updateOrderMutation.mutate({ 
                        orderId: activeOrder.id, 
                        status: getNextAction(activeOrder.status).next 
                      })}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3"
                    >
                      {getNextAction(activeOrder.status).text}
                    </Button>
                    
                    {activeOrder.status !== 'confirmed' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="border-gray-600 text-gray-300">
                          <Phone className="w-4 h-4 mr-2" />
                          Hubungi
                        </Button>
                        <Button variant="outline" className="border-gray-600 text-gray-300">
                          <Navigation className="w-4 h-4 mr-2" />
                          Navigasi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Peta Placeholder */}
                <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <Route className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Peta Rute & Navigasi</p>
                    <p className="text-xs text-gray-600">Jalur optimal ke tujuan</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">
                  {driverOnline ? 'Menunggu Pesanan' : 'Status Offline'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {driverOnline 
                    ? 'Anda sedang online. Pesanan baru akan muncul di sini.' 
                    : 'Aktifkan status online untuk mulai menerima pesanan.'
                  }
                </p>
                {!driverOnline && (
                  <Button 
                    onClick={() => setDriverOnline(true)}
                    className="bg-green-500 hover:bg-green-600 font-bold"
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
              <h3 className="font-bold text-lg text-white">Riwayat Pesanan</h3>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Filter Status */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={orderFilter === 'all' ? 'default' : 'outline'} 
                className={`text-xs ${orderFilter === 'all' ? 'bg-yellow-400 text-gray-900' : 'border-gray-600 text-gray-300'}`}
                onClick={() => setOrderFilter('all')}
              >
                Semua ({orders.length})
              </Button>
              <Button 
                variant={orderFilter === 'completed' ? 'default' : 'outline'} 
                className={`text-xs ${orderFilter === 'completed' ? 'bg-yellow-400 text-gray-900' : 'border-gray-600 text-gray-300'}`}
                onClick={() => setOrderFilter('completed')}
              >
                Selesai ({orders.filter(o => o.status === 'delivered').length})
              </Button>
              <Button 
                variant={orderFilter === 'cancelled' ? 'default' : 'outline'} 
                className={`text-xs ${orderFilter === 'cancelled' ? 'bg-yellow-400 text-gray-900' : 'border-gray-600 text-gray-300'}`}
                onClick={() => setOrderFilter('cancelled')}
              >
                Dibatalkan ({orders.filter(o => o.status === 'cancelled').length})
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{orders.filter(o => o.status === 'delivered').length}</p>
                <p className="text-xs text-gray-400">Total Selesai</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{formatCurrency(todayEarnings)}</p>
                <p className="text-xs text-gray-400">Hari Ini</p>
              </div>
            </div>

            {/* List Order */}
            <div className="space-y-3">
              {filteredOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Order #{order.id}</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)} text-gray-900`}>
                      {order.status === 'delivered' ? 'SELESAI' :
                       order.status === 'cancelled' ? 'DIBATALKAN' :
                       order.status.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">📍 {order.deliveryAddress}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400 font-bold">{formatCurrency(order.deliveryFee || 0)}</span>
                      {order.status === 'delivered' && (
                        <Star className="w-3 h-3 text-yellow-400" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredOrders.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">
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
              <h3 className="font-bold text-lg text-white">Dompet Driver</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            
            {/* Saldo */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-6 text-gray-900">
              <div className="text-center">
                <p className="text-sm font-medium opacity-80">TOTAL PENDAPATAN</p>
                <p className="text-3xl font-bold">{formatCurrency(driverData?.totalEarnings || 0)}</p>
                <p className="text-xs opacity-70 mt-1">Saldo dapat dicairkan</p>
                <div className="flex items-center justify-center mt-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-xs font-medium">Aktif</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => {
                  if (!withdrawAmount) {
                    setWithdrawAmount(String(driverData?.totalEarnings || 0));
                  }
                  const amount = Number(withdrawAmount);
                  if (amount > 0) {
                    withdrawMutation.mutate(amount);
                    setWithdrawAmount('');
                  }
                }}
                disabled={withdrawMutation.isPending || (driverData?.totalEarnings || 0) <= 0}
                className="bg-gray-800 text-white border border-gray-600 h-16 flex flex-col hover:bg-gray-700"
              >
                <DollarSign className="w-6 h-6 mb-1" />
                <span className="text-xs">
                  {withdrawMutation.isPending ? 'Memproses...' : 'Tarik Saldo'}
                </span>
              </Button>
              <Button 
                onClick={() => setShowWalletHistory(!showWalletHistory)}
                className="bg-gray-800 text-white border border-gray-600 h-16 flex flex-col hover:bg-gray-700"
              >
                <Clock className="w-6 h-6 mb-1" />
                <span className="text-xs">Riwayat</span>
              </Button>
            </div>

            {/* Withdraw Amount Input */}
            {withdrawAmount !== '' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <Label className="text-sm text-gray-300">Jumlah Penarikan</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                  placeholder="Masukkan jumlah"
                />
                <div className="flex space-x-2 mt-3">
                  <Button 
                    onClick={() => setWithdrawAmount('')}
                    variant="outline" 
                    className="flex-1 border-gray-600 text-gray-300"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={() => {
                      const amount = Number(withdrawAmount);
                      if (amount > 0) {
                        withdrawMutation.mutate(amount);
                        setWithdrawAmount('');
                      }
                    }}
                    disabled={withdrawMutation.isPending}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  >
                    Konfirmasi
                  </Button>
                </div>
              </div>
            )}

            {/* Transaction History */}
            {showWalletHistory && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-3">Riwayat Transaksi</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {earningsStats?.transactions?.map((transaction: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.type === 'delivery' ? 'Pengantaran' :
                           transaction.type === 'bonus' ? 'Bonus' :
                           transaction.type === 'withdrawal' ? 'Penarikan' : 'Transaksi'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('id-ID') : ''}
                        </p>
                      </div>
                      <span className={`font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-400 text-center py-4">Belum ada riwayat transaksi</p>
                  )}
                </div>
              </div>
            )}

            {/* Statistik Mingguan */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Statistik Pendapatan
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-400">
                    {formatCurrency(earningsStats?.today || 0)}
                  </p>
                  <p className="text-xs text-gray-400">Hari Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(earningsStats?.week || 0)}
                  </p>
                  <p className="text-xs text-gray-400">Minggu Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(earningsStats?.month || 0)}
                  </p>
                  <p className="text-xs text-gray-400">Bulan Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-400">
                    {formatCurrency(earningsStats?.total || 0)}
                  </p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </div>

            {/* Tips Earnings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">💡 Tips Meningkatkan Pendapatan</h4>
              <div className="space-y-2 text-sm text-gray-300">
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
              <h3 className="font-bold text-lg text-white">Profil Driver</h3>
              <Edit className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Profile Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              {!editProfile ? (
                <>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-900" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{user?.name || 'Driver'}</h4>
                      <p className="text-gray-400 text-sm">ID: #{user?.id}</p>
                      <p className="text-gray-400 text-sm">📱 {user?.phone || profileData.phone || 'Belum diatur'}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400 mr-1">⭐</span>
                        <span className="text-sm">{driverData?.rating || 5.0}</span>
                        <span className="text-gray-400 text-xs ml-2">
                          ({driverData?.totalDeliveries || 0} pengantaran)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Info */}
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <h5 className="font-medium text-sm mb-2">Informasi Kendaraan</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jenis</span>
                        <span>{driverData?.vehicleType || profileData.vehicleType || 'Belum diatur'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nomor Polisi</span>
                        <span>{driverData?.vehicleNumber || profileData.vehicleNumber || 'Belum diatur'}</span>
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
                  <h4 className="font-medium">Edit Informasi Profil</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-300">Nama Lengkap</Label>
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-300">Nomor Telepon</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="08123456789"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-300">Jenis Kendaraan</Label>
                      <select 
                        value={profileData.vehicleType}
                        onChange={(e) => setProfileData({...profileData, vehicleType: e.target.value})}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      >
                        <option value="">Pilih jenis kendaraan</option>
                        <option value="motorcycle">Motor</option>
                        <option value="car">Mobil</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-300">Nomor Polisi</Label>
                      <Input
                        value={profileData.vehicleNumber}
                        onChange={(e) => setProfileData({...profileData, vehicleNumber: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="B 1234 CD"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      onClick={() => setEditProfile(false)}
                      variant="outline" 
                      className="flex-1 border-gray-600 text-gray-300"
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={handleProfileSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                    >
                      {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Performa Driver</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{driverData?.rating || 5.0}</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{driverData?.totalDeliveries || 0}</p>
                  <p className="text-xs text-gray-400">Total Antar</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {orders.filter(o => o.status === 'delivered').length || 0}
                  </p>
                  <p className="text-xs text-gray-400">Bulan Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {driverData?.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </p>
                  <p className="text-xs text-gray-400">Status</p>
                </div>
              </div>
            </div>

            {/* Status & Verification */}
            <div className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Status Verifikasi</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">KTP</span>
                    <span className="text-green-400">✓ Terverifikasi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SIM</span>
                    <span className="text-green-400">✓ Terverifikasi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">STNK</span>
                    <span className="text-green-400">✓ Terverifikasi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Foto Profil</span>
                    <span className="text-green-400">✓ Terverifikasi</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="block">Kontak Darurat</span>
                    <span className="text-xs text-gray-400">+62 812-3456-7890</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  Edit
                </Button>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="block">Alamat Rumah</span>
                    <span className="text-xs text-gray-400">Jl. Merdeka No. 123, Tasikmalaya</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
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
              <h3 className="font-bold text-lg text-white">Pengaturan</h3>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Notification Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="font-medium">Notifikasi</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">Pesanan Baru</span>
                    <p className="text-xs text-gray-400">Terima notifikasi pesanan masuk</p>
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
                    <span className="text-sm">Update Pendapatan</span>
                    <p className="text-xs text-gray-400">Notifikasi saldo dan penarikan</p>
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
                    <span className="text-sm">Promosi & Bonus</span>
                    <p className="text-xs text-gray-400">Info promo dan reward khusus</p>
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
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="font-medium">Jam Kerja</h4>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400">Mulai Kerja</Label>
                    <Input
                      type="time"
                      value={workingHours.start}
                      onChange={(e) => {
                        const newHours = {...workingHours, start: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Selesai Kerja</Label>
                    <Input
                      type="time"
                      value={workingHours.end}
                      onChange={(e) => {
                        const newHours = {...workingHours, end: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400">Istirahat Mulai</Label>
                    <Input
                      type="time"
                      value={workingHours.breakStart}
                      onChange={(e) => {
                        const newHours = {...workingHours, breakStart: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Istirahat Selesai</Label>
                    <Input
                      type="time"
                      value={workingHours.breakEnd}
                      onChange={(e) => {
                        const newHours = {...workingHours, breakEnd: e.target.value};
                        setWorkingHours(newHours);
                        updateSettingsMutation.mutate({ workingHours: newHours });
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="font-medium">Lokasi & Privasi</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">Bagikan Lokasi</span>
                    <p className="text-xs text-gray-400">Untuk pelacakan pesanan real-time</p>
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
                    <span className="text-sm">Lokasi Presisi Tinggi</span>
                    <p className="text-xs text-gray-400">GPS akurat untuk navigasi</p>
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
                  <Label className="text-sm text-gray-400">Radius Kerja (km)</Label>
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
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="font-medium">Keamanan</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-sm">Ubah PIN Dompet</span>
                    <p className="text-xs text-gray-400">PIN untuk transaksi dompet</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-yellow-400">
                    Ubah
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-sm">Ubah Password</span>
                    <p className="text-xs text-gray-400">Password login akun</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-yellow-400">
                    Ubah
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-sm">Autentikasi 2 Faktor</span>
                    <p className="text-xs text-gray-400">Keamanan ekstra dengan SMS</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <HelpCircle className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="font-medium">Bantuan & Dukungan</h4>
              </div>
              
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700">
                  <span>Pusat Bantuan</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700">
                  <span>Chat dengan CS</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700">
                  <span>Lapor Masalah</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700">
                  <span>Syarat & Ketentuan</span>
                </Button>
              </div>
            </div>

            {/* Driver Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Status Driver</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-400">AKTIF</p>
                  <p className="text-xs text-gray-400">Status Akun</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-400">
                    {driverOnline ? 'ONLINE' : 'OFFLINE'}
                  </p>
                  <p className="text-xs text-gray-400">Status Kerja</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4">
              <Button 
                onClick={logout}
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700"
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => setActiveTab("beranda")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "beranda" ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Beranda</span>
          </button>
          
          <button
            onClick={() => setActiveTab("order")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "order" ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-xs font-medium">Order</span>
          </button>
          
          <button
            onClick={() => setActiveTab("dompet")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "dompet" ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-medium">Dompet</span>
          </button>
          
          <button
            onClick={() => setActiveTab("profil")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "profil" ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profil</span>
          </button>
          
          <button
            onClick={() => setActiveTab("pengaturan")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "pengaturan" ? "text-yellow-400" : "text-gray-500"
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