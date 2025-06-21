import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Eye
} from "lucide-react";

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState("beranda");

  // Data penjualan harian
  const salesData = {
    today: 2850000,
    yesterday: 2150000,
    growth: ((2850000 - 2150000) / 2150000 * 100).toFixed(1),
    thisWeek: 18750000,
    thisMonth: 72500000
  };

  // Status pesanan
  const orderStats = {
    pending: 5,
    ongoing: 12,
    completed: 47,
    total: 64
  };

  // Saldo dompet
  const walletBalance = 15750000;

  // Menu makanan
  const menuItems = [
    { id: 1, name: "Nasi Gudeg Yogya", price: 25000, image: "🍛", stock: 25, category: "Makanan Utama", sold: 15 },
    { id: 2, name: "Ayam Bakar Madu", price: 35000, image: "🍗", stock: 0, category: "Makanan Utama", sold: 8 },
    { id: 3, name: "Es Teh Manis", price: 8000, image: "🧊", stock: 50, category: "Minuman", sold: 32 },
    { id: 4, name: "Bakso Malang", price: 20000, image: "🍜", stock: 15, category: "Makanan Utama", sold: 12 },
    { id: 5, name: "Gado-gado Jakarta", price: 18000, image: "🥗", stock: 20, category: "Makanan Utama", sold: 9 },
    { id: 6, name: "Es Jeruk Peras", price: 10000, image: "🍊", stock: 30, category: "Minuman", sold: 18 }
  ];

  // Pesanan terbaru
  const recentOrders = [
    { id: 1, customer: "Ahmad S.", items: "2x Nasi Gudeg", total: 50000, status: "pending", time: "10:30", orderId: "#ORD001" },
    { id: 2, customer: "Sari M.", items: "1x Ayam Bakar, 1x Es Teh", total: 43000, status: "ongoing", time: "10:25", orderId: "#ORD002" },
    { id: 3, customer: "Budi P.", items: "3x Bakso Malang", total: 60000, status: "completed", time: "10:15", orderId: "#ORD003" },
    { id: 4, customer: "Dewi K.", items: "1x Gado-gado, 1x Es Jeruk", total: 28000, status: "pending", time: "10:35", orderId: "#ORD004" },
    { id: 5, customer: "Andi R.", items: "2x Es Teh Manis", total: 16000, status: "ongoing", time: "10:20", orderId: "#ORD005" }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'ongoing': return 'Diproses';
      case 'completed': return 'Selesai';
      default: return status;
    }
  };

  interface TabButtonProps {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
    onClick: (id: string) => void;
  }

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: TabButtonProps) => (
    <button
      onClick={() => onClick(id)}
      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-green-50 text-green-600 border border-green-200' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard Mitra</h1>
            <p className="text-sm text-gray-600">Restoran Rasa Nusantara</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {activeTab === "beranda" && (
          <div className="space-y-6">
            {/* Ringkasan Penjualan */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Penjualan Hari Ini</h2>
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(salesData.today)}</p>
                        <div className="flex items-center mt-1">
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">+{salesData.growth}%</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Pesanan</p>
                        <p className="text-xl font-bold text-gray-900">{orderStats.total}</p>
                        <p className="text-sm text-gray-500">{orderStats.completed} selesai</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Grafik Sederhana */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Tren Penjualan 7 Hari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-24 space-x-2">
                  {[1.8, 2.3, 1.9, 2.1, 2.8, 2.4, 2.85].map((value, index) => (
                    <div key={index} className="flex-1 bg-green-100 rounded-t-sm relative">
                      <div 
                        className="bg-green-500 rounded-t-sm transition-all duration-1000"
                        style={{ height: `${(value / 3) * 100}%` }}
                      />
                      <div className="text-xs text-gray-600 text-center mt-1">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][index]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Saldo Dompet */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-green-500 to-green-600">
              <CardContent className="p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Saldo Dompet Mitra</p>
                    <p className="text-2xl font-bold">{formatCurrency(walletBalance)}</p>
                    <p className="text-green-100 text-sm">Siap dicairkan</p>
                  </div>
                  <Button className="bg-white text-green-600 hover:bg-green-50">
                    Tarik Saldo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Pesanan Masuk */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pesanan Masuk</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab("pesanan")}
                  className="text-green-600"
                >
                  Lihat Semua
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Card className="border-0 shadow-sm bg-orange-50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">{orderStats.pending}</div>
                    <div className="text-xs text-orange-700">Menunggu</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{orderStats.ongoing}</div>
                    <div className="text-xs text-blue-700">Diproses</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                    <div className="text-xs text-green-700">Selesai</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {recentOrders.slice(0, 3).map(order => (
                  <Card key={order.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{order.customer}</span>
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{order.items}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</span>
                            <span className="text-xs text-gray-500">{order.time} • {order.orderId}</span>
                          </div>
                        </div>
                        {order.status === 'pending' && (
                          <Button size="sm" className="ml-4 bg-green-600 hover:bg-green-700 text-white">
                            Terima
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "pesanan" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Pesanan</h2>
            <div className="space-y-3">
              {recentOrders.map(order => (
                <Card key={order.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{order.customer}</span>
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{order.items}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</span>
                          <span className="text-xs text-gray-500">{order.time} • {order.orderId}</span>
                        </div>
                      </div>
                      <div className="ml-4 space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Terima
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Menu Makanan</h2>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {menuItems.map(item => (
                <Card key={item.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {item.image}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-gray-900">{formatCurrency(item.price)}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Terjual: {item.sold}</span>
                            <div className={`flex items-center space-x-1 ${item.stock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                              <Package className="w-4 h-4" />
                              <span className="text-sm font-medium">{item.stock === 0 ? 'Habis' : `${item.stock} tersisa`}</span>
                            </div>
                          </div>
                        </div>
                        {item.stock === 0 && (
                          <div className="mt-2">
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Stok Habis
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    <p className="text-gray-900">Restoran Rasa Nusantara</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Alamat</label>
                    <p className="text-gray-900">Jl. Merdeka No. 123, Tasikmalaya</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jam Operasional</label>
                    <p className="text-gray-900">09:00 - 22:00</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Buka</Badge>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Edit Profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
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