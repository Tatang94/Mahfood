import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Clock } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import type { FoodItem } from "@shared/schema";

interface FoodCardProps {
  foodItem: FoodItem;
}

export default function FoodCard({ foodItem }: FoodCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(foodItem.id, 1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={`/food/${foodItem.id}`}>
      <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden mobile-card">
        <div className="relative">
          <img 
            src={foodItem.imageUrl} 
            alt={foodItem.name}
            className="w-full h-36 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {foodItem.isPopular && (
            <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600 text-xs">
              Populer
            </Badge>
          )}
        </div>
        
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 line-clamp-1">
            {foodItem.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {foodItem.description}
          </p>
          
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{foodItem.rating}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{foodItem.prepTime} menit</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-primary font-bold text-base sm:text-lg">
              {formatPrice(foodItem.price)}
            </span>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 mobile-touch-target h-8 w-8 sm:h-9 sm:w-9"
              onClick={handleAddToCart}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
