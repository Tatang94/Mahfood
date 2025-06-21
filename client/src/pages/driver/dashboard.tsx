import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Timer
} from "lucide-react";

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [driverOnline, setDriverOnline] = useState(false);
  const [activeTab, setActiveTab] = useState("beranda");

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders/driver"],
    queryFn: () => fetch("/api/orders/driver").then(res => res.json()),
  });

  const { data: driverData } = useQuery({
    queryKey: ["/api/drivers/me"],
    queryFn: () => fetch("/api/drivers/me").then(res => res.json()),
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
            <h3 className="font-bold text-lg text-white">Riwayat Pesanan</h3>
            
            {/* Filter Status */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="border-gray-600 text-gray-300 text-xs">Semua</Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 text-xs">Selesai</Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 text-xs">Dibatalkan</Button>
            </div>

            {/* List Order */}
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Order #{order.id}</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)} text-gray-900`}>
                      {order.status}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{order.deliveryAddress}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.deliveryFee)}</span>
                    <span className="text-xs text-gray-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : ''}
                    </span>
                  </div>
                </div>
              ))}
              
              {orders.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Belum ada riwayat pesanan</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Dompet */}
        {activeTab === "dompet" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-white">Dompet Driver</h3>
            
            {/* Saldo */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-6 text-gray-900">
              <div className="text-center">
                <p className="text-sm font-medium opacity-80">TOTAL PENDAPATAN</p>
                <p className="text-3xl font-bold">{formatCurrency(driverData?.totalEarnings || 0)}</p>
                <p className="text-xs opacity-70 mt-1">Saldo dapat dicairkan</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button className="bg-gray-800 text-white border border-gray-600 h-16 flex flex-col">
                <DollarSign className="w-6 h-6 mb-1" />
                <span className="text-xs">Tarik Saldo</span>
              </Button>
              <Button className="bg-gray-800 text-white border border-gray-600 h-16 flex flex-col">
                <Clock className="w-6 h-6 mb-1" />
                <span className="text-xs">Riwayat</span>
              </Button>
            </div>

            {/* Statistik */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Statistik Hari Ini</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                  <p className="text-xs text-gray-400">Pesanan Selesai</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.deliveryFee || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-400">Pendapatan Hari Ini</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Profil */}
        {activeTab === "profil" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-white">Profil Driver</h3>
            
            {/* Profile Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-900" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{user?.name || 'Driver'}</h4>
                  <p className="text-gray-400 text-sm">ID: #{user?.id}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-400 mr-1">⭐</span>
                    <span className="text-sm">{driverData?.rating || 5.0}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      ({driverData?.totalDeliveries || 0} pengantaran)
                    </span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full border-gray-600 text-gray-300">
                Edit Profil
              </Button>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-gray-400" />
                  <span>Informasi Kendaraan</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>Kontak Darurat</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <span>Verifikasi Dokumen</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Pengaturan */}
        {activeTab === "pengaturan" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-white">Pengaturan</h3>
            
            {/* Quick Settings */}
            <div className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span>Notifikasi</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>Lokasi & Privasi</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>Jam Kerja</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span>Bantuan & Dukungan</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4">
              <Button 
                onClick={logout}
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Keluar dari Akun
              </Button>
            </div>

            {/* App Info */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">FoodieID Driver v1.0.0</p>
              <p className="text-xs text-gray-500">© 2025 TasFood Indonesia</p>
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