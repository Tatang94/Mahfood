import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, CreditCard, History, Star } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const orderHistory = [
    {
      id: "ORD001",
      date: "2024-06-20",
      items: "Gudeg Jogja Komplit, Mie Ayam Bakso",
      total: 43000,
      status: "Selesai"
    },
    {
      id: "ORD002", 
      date: "2024-06-18",
      items: "Nasi Padang Spesial",
      total: 32000,
      status: "Selesai"
    },
    {
      id: "ORD003",
      date: "2024-06-15", 
      items: "Sate Ayam Madura, Rawon Surabaya",
      total: 48000,
      status: "Dibatalkan"
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil Saya</h1>
          <p className="text-gray-600">Kelola informasi akun dan riwayat pesanan Anda</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">John Doe</h3>
                  <p className="text-gray-500">Member sejak Juni 2024</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      defaultValue="John Doe"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="john.doe@email.com"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      defaultValue="08123456789"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full"
                  variant={isEditing ? "default" : "outline"}
                >
                  {isEditing ? "Simpan Perubahan" : "Edit Profil"}
                </Button>
              </CardContent>
            </Card>

            {/* Loyalty Points */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Poin Loyalitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">1,250</div>
                  <p className="text-gray-600 mb-4">Poin tersedia</p>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-sm text-primary font-medium">
                      Tukar 1,000 poin = Diskon Rp 10,000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders & Addresses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Alamat Tersimpan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Rumah</h4>
                    <Badge variant="secondary">Utama</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Jl. Sudirman No. 123, Kelurahan Senayan<br />
                    Kecamatan Kebayoran Baru, Jakarta Selatan 12190
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Kantor</h4>
                  <p className="text-gray-600 text-sm">
                    Jl. Thamrin No. 456, Menteng<br />
                    Jakarta Pusat 10350
                  </p>
                </div>

                <Button variant="outline" className="w-full">
                  Tambah Alamat Baru
                </Button>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">TasPay</h4>
                      <p className="text-gray-600 text-sm">Dompet digital aplikasi</p>
                    </div>
                    <Badge variant="secondary">Aktif</Badge>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Bayar di Tempat (COD)</h4>
                      <p className="text-gray-600 text-sm">Bayar tunai saat pengiriman</p>
                    </div>
                    <Badge variant="outline">Tersedia</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Riwayat Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">#{order.id}</h4>
                          <p className="text-sm text-gray-500">{order.date}</p>
                        </div>
                        <Badge 
                          variant={order.status === "Selesai" ? "default" : 
                                  order.status === "Dibatalkan" ? "destructive" : "secondary"}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{order.items}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-primary">
                          {formatPrice(order.total)}
                        </span>
                        <Button variant="outline" size="sm">
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Lihat Semua Pesanan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}