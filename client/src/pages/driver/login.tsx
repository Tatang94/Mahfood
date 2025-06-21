import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, User, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function DriverLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();
  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await login(email, password);
      if (result.user.role !== 'driver') {
        toast({
          title: "Login Gagal",
          description: "Akun ini bukan akun driver",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Login Driver Berhasil",
        description: "Selamat datang di dashboard driver!",
      });
      window.location.href = "/driver";
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
      role: 'driver',
      vehicleType: formData.get('vehicleType') as string,
      vehicleNumber: formData.get('vehicleNumber') as string,
    };

    try {
      // Register tanpa auto login
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrasi gagal');
      }

      toast({
        title: "Registrasi Driver Berhasil",
        description: "Akun driver telah dibuat. Tim kami akan menghubungi untuk verifikasi. Silakan login dengan email dan password Anda.",
      });
      
      // Reset form dan fokus ke tab login
      const form = e.target as HTMLFormElement;
      form.reset();
      
      // Switch ke tab login
      setActiveTab("login");
    } catch (error: any) {
      toast({
        title: "Registrasi Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-peach-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
            <Truck className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Driver TasFood
          </CardTitle>
          <p className="text-gray-600">
            Bergabung sebagai driver dan mulai menghasilkan
          </p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="driver@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Nama lengkap"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor HP</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="081234567890"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Jenis Kendaraan</Label>
                  <select name="vehicleType" className="w-full p-2 border border-gray-300 rounded-md" required>
                    <option value="">Pilih kendaraan</option>
                    <option value="motorcycle">Motor</option>
                    <option value="car">Mobil</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Nomor Plat</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="vehicleNumber"
                      name="vehicleNumber"
                      type="text"
                      placeholder="B 1234 ABC"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="driver@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                </div>

                <div className="text-xs text-gray-600 bg-orange-50 p-3 rounded">
                  <strong>Syarat menjadi driver:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Memiliki SIM yang valid</li>
                    <li>• Kendaraan dalam kondisi baik</li>
                    <li>• Berusia minimal 18 tahun</li>
                    <li>• Memiliki smartphone</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Daftar Driver"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}