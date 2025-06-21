import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Percent, Clock, Star } from "lucide-react";

export default function Promotions() {
  const promotions = [
    {
      id: 1,
      title: "Gratis Ongkir Hari Ini",
      description: "Bebas ongkir untuk semua pesanan minimal Rp 50.000",
      discount: "100%",
      validUntil: "23:59 WIB",
      code: "GRATISONGKIR",
      color: "bg-green-500"
    },
    {
      id: 2,
      title: "Diskon Weekend",
      description: "Hemat 30% untuk semua menu makanan tradisional",
      discount: "30%",
      validUntil: "Minggu, 23 Juni",
      code: "WEEKEND30",
      color: "bg-orange-500"
    },
    {
      id: 3,
      title: "Menu Baru",
      description: "Coba menu baru dan dapatkan diskon 25%",
      discount: "25%",
      validUntil: "30 Juni 2024",
      code: "NEWMENU25",
      color: "bg-purple-500"
    }
  ];

  return (
    <section className="py-8 bg-gradient-to-r from-primary/10 to-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Promo Terbaru</h2>
            <p className="text-gray-600">Jangan lewatkan penawaran menarik hari ini!</p>
          </div>
          <Gift className="w-8 h-8 text-primary" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-2 ${promo.color}`}></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="text-xs">
                    Diskon {promo.discount}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {promo.validUntil}
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {promo.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {promo.description}
                </p>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-500 mb-1">Kode Promo:</div>
                  <div className="font-mono font-bold text-primary text-lg">
                    {promo.code}
                  </div>
                </div>

                <Button className="w-full" size="sm">
                  Gunakan Sekarang
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline">
            Lihat Semua Promo
          </Button>
        </div>
      </div>
    </section>
  );
}