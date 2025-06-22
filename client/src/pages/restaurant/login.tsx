import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Store, User, Phone, MapPin, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PhotoUpload from "@/components/photo-upload";

export default function RestaurantLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await login(email, password);
      if (result.user.role !== 'restaurant') {
        toast({
          title: "Login Gagal",
          description: "Akun ini bukan akun restoran",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Login Restoran Berhasil",
        description: "Selamat datang di dashboard restoran!",
      });
      setTimeout(() => {
        window.location.href = "/restaurant/dashboard";
      }, 1000);
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
      name: formData.get('ownerName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
      role: 'restaurant',
      restaurantName: formData.get('restaurantName') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      imageUrl: formData.get('imageUrl') as string,
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
        title: "Registrasi Restoran Berhasil",
        description: "Akun restoran telah dibuat. Tim kami akan menghubungi untuk verifikasi. Silakan login dengan email dan password Anda.",
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
            <Store className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Mitra TasFood
          </CardTitle>
          <p className="text-gray-600">
            Bergabung sebagai mitra dan jangkau lebih banyak pelanggan
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
                  <Label htmlFor="email">Email Restoran</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="restoran@email.com"
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
                  <Label htmlFor="restaurant-name">Nama Restoran</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="restaurant-name"
                      name="restaurantName"
                      type="text"
                      placeholder="Nama restoran"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner-name">Nama Pemilik</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="owner-name"
                      name="ownerName"
                      type="text"
                      placeholder="Nama pemilik"
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
                  <Label htmlFor="address">Alamat Restoran</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Alamat lengkap restoran"
                      className="pl-10 min-h-[60px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Restoran</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Ceritakan tentang restoran Anda..."
                    className="min-h-[60px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo Restoran</Label>
                  <PhotoUpload
                    onPhotoChange={(file, preview) => {
                      setLogoFile(file);
                      setLogoPreview(preview);
                    }}
                    currentPhoto={logoPreview ?? undefined}
                    placeholder="Upload logo restoran"
                    maxSize={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="restoran@email.com"
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
                  <strong>Benefit menjadi mitra:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Jangkauan pelanggan lebih luas</li>
                    <li>• Dashboard analitik penjualan</li>
                    <li>• Support marketing dari TasFood</li>
                    <li>• Komisi kompetitif</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Daftar Mitra"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}