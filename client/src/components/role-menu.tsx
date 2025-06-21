import { useState } from "react";
import { Menu, X, Store, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import LoginModal from "@/components/login-modal";

interface RoleMenuProps {
  className?: string;
}

export default function RoleMenu({ className = "" }: RoleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<"customer" | "restaurant" | "driver">("customer");

  const handleRoleLogin = (role: "customer" | "restaurant" | "driver") => {
    setIsOpen(false);
    
    if (role === "driver") {
      // Direct redirect ke halaman login driver
      window.location.href = "/driver/login";
    } else if (role === "restaurant") {
      // Direct redirect ke halaman login restoran
      window.location.href = "/restaurant/login";
    } else if (role === "customer") {
      // Untuk customer, gunakan modal login
      setLoginRole(role);
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl border z-50 p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Pilih Role Login</h3>
                <p className="text-sm text-gray-600">Silakan pilih sebagai apa Anda ingin masuk</p>
              </div>

              <div className="space-y-3">
                {/* Customer Login */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                  onClick={() => handleRoleLogin("customer")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Pelanggan</h4>
                        <p className="text-sm text-gray-600">Pesan makanan favorit Anda</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Restaurant Login */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                  onClick={() => handleRoleLogin("restaurant")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Store className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Restoran</h4>
                        <p className="text-sm text-gray-600">Kelola menu dan pesanan</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Mitra
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Driver Login */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                  onClick={() => handleRoleLogin("driver")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Driver</h4>
                        <p className="text-sm text-gray-600">Antar pesanan dan dapatkan penghasilan</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Mitra
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <Link href="/help" className="text-primary hover:underline">
                    Bantuan
                  </Link>
                  <Link href="/about" className="text-gray-600 hover:underline">
                    Tentang Kami
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        defaultRole={loginRole}
      />
    </>
  );
}