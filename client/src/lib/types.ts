export interface CartItemWithDetails {
  id: number;
  foodItemId: number;
  quantity: number;
  sessionId: string;
  foodItem?: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    description: string;
  };
  total: number;
}

export interface CartSummary {
  items: CartItemWithDetails[];
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export type CategoryIcon = "utensils" | "pizza-slice" | "coffee" | "birthday-cake";

export interface FoodCategory {
  id: number;
  name: string;
  description?: string;
  icon: CategoryIcon;
  color: string;
}
