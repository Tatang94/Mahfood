import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import type { FoodItem } from "@shared/schema";

export default function FoodDetail() {
  const [, params] = useRoute("/food/:id");
  const foodItemId = params?.id ? parseInt(params.id) : null;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const { data: foodItem, isLoading } = useQuery<FoodItem>({
    queryKey: ["/api/food-items", foodItemId],
    queryFn: async () => {
      const response = await fetch(`/api/food-items/${foodItemId}`);
      if (!response.ok) throw new Error('Food item not found');
      return response.json();
    },
    enabled: !!foodItemId,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!foodItem) return;
    await addToCart(foodItem.id, quantity);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!foodItem) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Makanan tidak ditemukan</h2>
            <Link href="/menu">
              <Button>Kembali ke Menu</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/menu">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Menu
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative">
            <img 
              src={foodItem.imageUrl} 
              alt={foodItem.name}
              className="w-full h-96 object-cover rounded-2xl shadow-lg"
            />
            {foodItem.isPopular && (
              <Badge className="absolute top-4 left-4 bg-orange-500 hover:bg-orange-600">
                Populer
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {foodItem.name}
              </h1>
              <p className="text-gray-600 text-lg">
                {foodItem.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{foodItem.rating}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-5 h-5" />
                <span>{foodItem.prepTime} menit</span>
              </div>
            </div>

            <Separator />

            {/* Ingredients */}
            <div>
              <h3 className="font-semibold text-xl mb-4">Bahan-bahan:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {foodItem.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {ingredient.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-700">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Price and Add to Cart */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(foodItem.price)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">per porsi</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Jumlah:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustQuantity(-1)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="w-12 text-center font-semibold text-lg">
                        {quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustQuantity(1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  size="lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Tambah ke Keranjang - {formatPrice(foodItem.price * quantity)}
                </Button>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Detail Makanan:</h3>
                <p className="text-gray-600 leading-relaxed">
                  Makanan berkualitas tinggi yang dibuat dengan bahan-bahan segar dan bumbu tradisional Indonesia. 
                  Setiap hidangan disiapkan dengan penuh perhatian untuk memberikan cita rasa yang autentik dan menggugah selera. 
                  Cocok untuk dinikmati sebagai hidangan utama atau sebagai pelengkap makanan lainnya.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
