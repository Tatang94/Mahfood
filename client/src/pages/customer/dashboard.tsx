import { useState, useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import TopUpModal from "@/components/topup-modal";
import { 
  Search,
  Wallet,
  Star,
  Home,
  Clock,
  CreditCard,
  Bell,
  User,
  Zap,
  Coffee,
  Pizza,
  IceCream,
  Salad,
  Gift,
  Package,
  ShoppingBag,
  Truck,
  LogOut,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Plus
} from "lucide-react";
import type { Order } from "@shared/schema";

export default function CustomerDashboard() {
  // Hide any existing footers when component mounts
  React.useEffect(() => {
    const footers = document.querySelectorAll('footer, .mobile-nav');
    footers.forEach(footer => {
      (footer as HTMLElement).style.display = 'none';
    });
    
    return () => {
      // Restore on unmount if needed
      footers.forEach(footer => {
        (footer as HTMLElement).style.display = '';
      });
    };
  }, []);
  
  const [activeTab, setActiveTab] = useState("beranda");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Initialize profile data
  React.useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || ""
      });
    }
  }, [user]);
  
  // Fetch user orders untuk menghitung poin dan saldo
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/customer", user?.id],
    queryFn: () => fetch(`/api/orders/customer?customerId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Hitung saldo dan poin berdasarkan data real - mulai dari 0
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const totalSpent = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error("Gagal mengambil data wallet");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const walletBalance = walletData?.balance || 0;
  
  // Poin loyalitas berdasarkan total pembelian yang completed (1 poin per 10rb)
  const loyaltyPoints = Math.floor(totalSpent / 10000);

  const categories = [
    { id: 'fast-food', name: 'Makanan Cepat Saji', icon: Zap, color: 'bg-orange-100' },
    { id: 'drinks', name: 'Minuman', icon: Coffee, color: 'bg-orange-100' },
    { id: 'traditional', name: 'Makanan Tradisional', icon: Pizza, color: 'bg-orange-100' },
    { id: 'dessert', name: 'Dessert', icon: IceCream, color: 'bg-orange-100' },
    { id: 'healthy', name: 'Makanan Sehat', icon: Salad, color: 'bg-orange-100' },
    { id: 'promo', name: 'Promo Hemat', icon: Gift, color: 'bg-orange-100' },
    { id: 'special', name: 'Paket Spesial', icon: Package, color: 'bg-orange-100' },
    { id: 'other', name: 'Lainnya', icon: ShoppingBag, color: 'bg-orange-100' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Berhasil Keluar",
        description: "Anda telah berhasil keluar dari akun",
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal keluar dari akun",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui profil');
      }

      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil berhasil diperbarui",
      });
      setIsEditingProfile(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive",
      });
    }
  };

  const paymentMethods = [
    { id: 'taspay', name: 'TasPay', icon: Wallet, balance: walletBalance },
  ];

  return (
    <div className="min-h-screen bg-white pb-16 relative customer-dashboard w-full h-full">
      {/* Header dengan Search */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            Hai, {user?.name || 'Customer'}!
          </h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Cari makanan, restoran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 w-full rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400"
          />
        </div>

        {/* Wallet & Loyalty Points */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-200 p-2 rounded-full">
                  <Wallet className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Saldo Dompet</p>
                  <p className="text-lg font-bold text-orange-800">
                    {walletBalance === 0 ? 'Rp 0' : formatCurrency(walletBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-200 p-2 rounded-full">
                  <Star className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Poin Loyalitas</p>
                  <p className="text-lg font-bold text-orange-800">
                    {loyaltyPoints === 0 ? '0 poin' : `${loyaltyPoints} poin`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 py-6 mb-16">
        {/* Kategori Makanan */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategori</h2>
          <div className="grid grid-cols-4 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.id} className="flex flex-col items-center">
                  <div className={`${category.color} p-4 rounded-full mb-2 shadow-sm`}>
                    <IconComponent className="w-6 h-6 text-orange-700" />
                  </div>
                  <span className="text-xs text-center text-gray-700 font-medium">
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner Promosi */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-orange-400 to-orange-600 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-lg font-bold mb-2">Promo Hari Ini!</h3>
                  <p className="text-sm opacity-90">Gratis ongkir untuk pesanan pertama</p>
                  <p className="text-sm opacity-90">Kurir kami selalu pakai masker untuk keamanan</p>
                </div>
                <div className="text-white">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Truck className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content berdasarkan tab aktif */}
        {activeTab === "beranda" && (
          <div className="space-y-6">
            {/* Status Ringkasan */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-700">{completedOrders.length}</div>
                  <div className="text-sm text-orange-600">Pesanan Selesai</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-700">{formatCurrency(totalSpent)}</div>
                  <div className="text-sm text-orange-600">Total Belanja</div>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">Restoran Populer</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Restoran {i}</h4>
                        <p className="text-sm text-gray-600">Makanan Indonesia • 4.5★</p>
                        <p className="text-sm text-orange-600 font-medium">Gratis Ongkir</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "riwayat" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Riwayat Pesanan</h3>
            <div className="space-y-4">
              {orders.length > 0 ? orders.slice(0, 10).map((order) => (
                <Card key={order.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">Pesanan #{order.id}</h4>
                        <p className="text-sm text-gray-600">{formatCurrency(order.totalAmount || 0)}</p>
                        <p className="text-xs text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Tanggal tidak tersedia'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {order.status === 'delivered' ? 'Terkirim' :
                         order.status === 'cancelled' ? 'Dibatalkan' :
                         'Dalam Proses'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada riwayat pesanan</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "pembayaran" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h3>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <Card key={method.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-full">
                            <IconComponent className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <span className="font-medium">{method.name}</span>
                            {method.balance !== null && (
                              <p className="text-sm text-gray-600">
                                Saldo: {method.balance === 0 ? 'Rp 0' : formatCurrency(method.balance)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                          {walletBalance === 0 ? 'Top Up' : 'Top Up'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-orange-800 mb-2">TasPay - Satu-satunya Metode Pembayaran</h4>
                  <p className="text-sm text-orange-700">
                    TasPay adalah sistem pembayaran terintegrasi dengan enkripsi tingkat bank yang aman dan mudah digunakan
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifikasi" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Bell className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Pesanan Terkirim</h4>
                        <p className="text-sm text-gray-600">Pesanan #{i} telah sampai di alamat tujuan</p>
                        <p className="text-xs text-gray-500">2 jam yang lalu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "akun" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Profil Saya</h3>
            
            {!isEditingProfile ? (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{user?.name || 'Customer'}</h4>
                      <p className="text-sm text-gray-600">{user?.email || 'customer@email.com'}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-sm text-gray-600">{profileData.email || 'Belum diisi'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nomor HP</p>
                          <p className="text-sm text-gray-600">{profileData.phone || 'Belum diisi'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Alamat</p>
                          <p className="text-sm text-gray-600">{profileData.address || 'Belum diisi'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("pembayaran")}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Metode Pembayaran
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Keluar dari Akun
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Edit Profil</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Batal
                    </Button>
                  </div>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input
                        id="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Masukkan nama lengkap"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Masukkan email"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Nomor HP</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Masukkan nomor HP"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Alamat</Label>
                      <Input
                        id="address"
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Masukkan alamat lengkap"
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    >
                      Simpan Perubahan
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "pembayaran" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h3>
            
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Wallet className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <span className="font-medium">TasPay</span>
                        <p className="text-sm text-gray-600">
                          Saldo: Rp {walletBalance.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => setIsTopUpModalOpen(true)}
                    >
                      Top Up
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium">Bayar di Tempat (COD)</span>
                        <p className="text-sm text-gray-600">Bayar tunai saat pengiriman</p>
                      </div>
                    </div>
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Tersedia
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      <TopUpModal 
        isOpen={isTopUpModalOpen} 
        onClose={() => setIsTopUpModalOpen(false)} 
      />

      {/* Bottom Navigation */}
      <div className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: 'white', borderTop: '1px solid #e5e7eb' }}>
        <div className="grid grid-cols-5 h-16 w-full">
          <button
            onClick={() => setActiveTab("beranda")}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "beranda" ? "text-orange-600 bg-orange-50" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium mt-1">Beranda</span>
          </button>
          
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "riwayat" ? "text-orange-600 bg-orange-50" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs font-medium mt-1">Riwayat</span>
          </button>
          
          <button
            onClick={() => setActiveTab("pembayaran")}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "pembayaran" ? "text-orange-600 bg-orange-50" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium mt-1">Pembayaran</span>
          </button>
          
          <button
            onClick={() => setActiveTab("notifikasi")}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "notifikasi" ? "text-orange-600 bg-orange-50" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs font-medium mt-1">Notifikasi</span>
          </button>
          
          <button
            onClick={() => setActiveTab("akun")}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "akun" ? "text-orange-600 bg-orange-50" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium mt-1">Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}