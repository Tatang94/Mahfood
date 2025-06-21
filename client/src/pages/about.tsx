import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Users, Award, Target } from "lucide-react";

export default function About() {
  const stats = [
    { icon: Users, label: "Pelanggan Aktif", value: "50,000+" },
    { icon: MapPin, label: "Kota Terlayani", value: "25+" },
    { icon: Award, label: "Restoran Partner", value: "1,500+" },
    { icon: Clock, label: "Waktu Rata-rata Antar", value: "25 menit" },
  ];

  const team = [
    {
      name: "Ahmad Rizki",
      position: "CEO & Founder",
      description: "Memimpin visi dan strategi perusahaan dengan pengalaman 10+ tahun di industri teknologi.",
      avatar: "AR"
    },
    {
      name: "Siti Nurhaliza",
      position: "Head of Operations",
      description: "Mengelola operasional harian dan memastikan kualitas layanan terbaik untuk pelanggan.",
      avatar: "SN"
    },
    {
      name: "Budi Setiawan",
      position: "Head of Technology",
      description: "Membangun dan mengembangkan platform teknologi yang andal dan inovatif.",
      avatar: "BS"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Tentang FoodieID
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Kami adalah platform pengiriman makanan terdepan di Indonesia yang berkomitmen 
            menghadirkan cita rasa autentik Nusantara ke meja makan Anda.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-bold">Misi Kami</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Menyediakan platform yang menghubungkan kuliner tradisional Indonesia 
                  dengan teknologi modern, memudahkan akses masyarakat terhadap makanan 
                  berkualitas dengan layanan pengiriman yang cepat dan terpercaya.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-bold">Visi Kami</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Menjadi platform pengiriman makanan nomor satu di Indonesia yang 
                  melestarikan kekayaan kuliner Nusantara dan memberdayakan UMKM 
                  kuliner lokal melalui teknologi digital.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">FoodieID dalam Angka</h2>
            <p className="text-gray-600">Pencapaian kami dalam melayani masyarakat Indonesia</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tim Kami</h2>
            <p className="text-gray-600">Orang-orang hebat di balik kesuksesan FoodieID</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-bold">{member.avatar}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-4">{member.position}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
            <p className="text-gray-600">Kami siap membantu Anda kapan saja</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Alamat Kantor</h3>
                <p className="text-gray-600">
                  Jl. Sudirman Kav. 52-53<br />
                  Jakarta Pusat 10210<br />
                  Indonesia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Telepon</h3>
                <p className="text-gray-600">
                  Customer Service: +62 21 1234 5678<br />
                  WhatsApp: +62 811 1234 5678<br />
                  24/7 Support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <p className="text-gray-600">
                  info@foodieid.com<br />
                  support@foodieid.com<br />
                  partnership@foodieid.com
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Hubungi Customer Service
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}