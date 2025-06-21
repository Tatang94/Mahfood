import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FoodCard from "@/components/food-card";
import { Link } from "wouter";
import { Utensils, Pizza, Coffee, Cake, Clock, Shield, Headphones, Star } from "lucide-react";
import Testimonials from "@/components/testimonials";
import Promotions from "@/components/promotions";
import LoyaltyProgram from "@/components/loyalty-program";
import type { Category, FoodItem } from "@shared/schema";

export default function Home() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: popularItems } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items?popular=true"],
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "utensils": return <Utensils className="w-8 h-8" />;
      case "pizza-slice": return <Pizza className="w-8 h-8" />;
      case "coffee": return <Coffee className="w-8 h-8" />;
      case "birthday-cake": return <Cake className="w-8 h-8" />;
      default: return <Utensils className="w-8 h-8" />;
    }
  };

  const getCategoryGradient = (color: string) => {
    switch (color) {
      case "from-primary to-secondary": return "gradient-primary";
      case "from-orange-400 to-red-500": return "gradient-orange";
      case "from-blue-400 to-purple-500": return "gradient-blue";
      case "from-pink-400 to-red-400": return "gradient-pink";
      default: return "gradient-primary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-peach-50 to-orange-100">
      {/* Onboarding Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-orange-600 mb-2 tracking-tight">
              TasFood
            </h1>
            <div className="w-24 h-1 bg-orange-400 mx-auto rounded-full"></div>
          </div>

          {/* Illustration */}
          <div className="mb-12 relative">
            <div className="w-80 h-80 md:w-96 md:h-96 mx-auto relative">
              {/* Background Circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full opacity-20"></div>
              
              {/* Scooter Illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Delivery Person */}
                  <div className="text-6xl md:text-8xl mb-4 animate-bounce">
                    🛵
                  </div>
                  {/* Package */}
                  <div className="absolute -top-8 -right-4 text-3xl md:text-4xl animate-pulse">
                    📦
                  </div>
                  {/* Motion Lines */}
                  <div className="absolute top-1/2 -left-12 transform -translate-y-1/2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-0.5 bg-orange-300 rounded animate-pulse"></div>
                      <div className="w-3 h-0.5 bg-orange-300 rounded animate-pulse delay-75"></div>
                      <div className="w-2 h-0.5 bg-orange-300 rounded animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="mb-12 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              Pengantaran Makanan Tercepat
              <span className="block text-orange-600">di Tasikmalaya</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Nikmati makanan favorit dari restoran terbaik dengan layanan pengantaran super cepat. 
              Pesan sekarang dan rasakan kemudahan berbelanja makanan!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center">
            <Link href="/customer/signin" className="block w-full md:w-auto">
              <Button 
                size="lg" 
                className="w-full md:w-48 h-14 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Daftar
              </Button>
            </Link>
            <Link href="/customer/login" className="block w-full md:w-auto">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full md:w-48 h-14 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Masuk
              </Button>
            </Link>
          </div>

          {/* Features Quick Preview */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">30 Menit</p>
              <p className="text-xs text-gray-500">Pengiriman</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Kualitas</p>
              <p className="text-xs text-gray-500">Terjamin</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Headphones className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Support</p>
              <p className="text-xs text-gray-500">24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Optional: Show quick preview of what's available */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            Siap untuk Memulai?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">100+ Restoran</h4>
              <p className="text-gray-600">Pilihan restoran terbaik di Tasikmalaya</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">30 Menit</h4>
              <p className="text-gray-600">Pengiriman tercepat ke alamat Anda</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Rating 4.8</h4>
              <p className="text-gray-600">Kepuasan pelanggan adalah prioritas</p>
            </div>
          </div>
          
          <Link href="/customer/signin">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg px-12 h-14 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Mulai Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
            Bergabung sebagai Mitra
          </h3>
          <p className="text-lg text-gray-600 mb-12">
            Ingin bergabung sebagai driver atau restoran? Daftar sekarang!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Jadi Driver</h4>
              <p className="text-gray-600 mb-4">Dapatkan penghasilan tambahan dengan mengantar makanan</p>
              <Link href="/driver/signin">
                <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Daftar Driver
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pizza className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Jadi Mitra Restoran</h4>
              <p className="text-gray-600 mb-4">Jual makanan online dan jangkau lebih banyak pelanggan</p>
              <Link href="/restaurant/signin">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Daftar Restoran
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
