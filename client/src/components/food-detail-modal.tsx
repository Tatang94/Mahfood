import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Star, Clock } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import type { FoodItem } from "@shared/schema";

interface FoodDetailModalProps {
  foodItem: FoodItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodDetailModal({ foodItem, isOpen, onClose }: FoodDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  if (!foodItem) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async () => {
    await addToCart(foodItem.id, quantity);
    setQuantity(1);
    onClose();
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <img 
            src={foodItem.imageUrl} 
            alt={foodItem.name}
            className="w-full h-64 object-cover rounded-lg"
          />
          
          <DialogHeader>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {foodItem.name}
                </DialogTitle>
                <p className="text-gray-600">{foodItem.description}</p>
              </div>
              {foodItem.isPopular && (
                <Badge className="bg-orange-500 hover:bg-orange-600">
                  Populer
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex items-center gap-4 text-sm text-gray-500">
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

          <div>
            <h3 className="font-semibold text-lg mb-3">Bahan-bahan:</h3>
            <div className="grid grid-cols-2 gap-3">
              {foodItem.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm font-medium">
                      {ingredient.charAt(0)}
                    </span>
                  </div>
                  <span className="text-gray-700 text-sm">{ingredient}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Detail:</h3>
            <p className="text-gray-600 leading-relaxed">
              Makanan berkualitas tinggi yang dibuat dengan bahan-bahan segar dan bumbu tradisional Indonesia. 
              Setiap hidangan disiapkan dengan penuh perhatian untuk memberikan cita rasa yang autentik dan menggugah selera.
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(foodItem.price)}
            </span>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Jumlah:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustQuantity(-1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <span className="w-8 text-center font-semibold">{quantity}</span>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
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
            Tambah ke Keranjang - {formatPrice(foodItem.price * quantity)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
