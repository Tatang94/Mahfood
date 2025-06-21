import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Truck, ChefHat } from "lucide-react";
import { Link } from "wouter";

export default function RoleSelector() {
  const roles = [
    {
      id: "customer",
      title: "Pelanggan",
      description: "Pesan makanan favorit dari restoran terbaik",
      icon: Users,
      color: "bg-blue-500",
      registerPath: "/customer/login",
      signinPath: "/customer/signin"
    },
    {
      id: "driver",
      title: "Driver",
      description: "Antar pesanan dan dapatkan penghasilan tambahan",
      icon: Truck,
      color: "bg-green-500",
      registerPath: "/driver/login",
      signinPath: "/driver/signin"
    },
    {
      id: "restaurant",
      title: "Restoran",
      description: "Kelola restoran dan jual makanan online",
      icon: ChefHat,
      color: "bg-orange-500",
      registerPath: "/restaurant/login",
      signinPath: "/restaurant/signin"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-peach-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-600 mb-4">TasFood</h1>
          <p className="text-xl text-gray-600">Pilih peran dan cara masuk ke platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 rounded-full ${role.color} flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {role.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {role.description}
                  </p>
                  
                  <div className="space-y-3">
                    <Link href={role.registerPath}>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                        Daftar sebagai {role.title}
                      </Button>
                    </Link>
                    
                    <Link href={role.signinPath}>
                      <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold">
                        Masuk sebagai {role.title}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500">
            Platform lengkap untuk ekosistem pengiriman makanan di Tasikmalaya
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}