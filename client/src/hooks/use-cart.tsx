import { createContext, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartSummary } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  sessionId: string;
  cart: CartSummary | undefined;
  isLoading: boolean;
  addToCart: (foodItemId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("cart-session-id");
    if (stored) return stored;
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("cart-session-id", newId);
    return newId;
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<CartSummary>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const response = await fetch(`/api/cart?sessionId=${sessionId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
    enabled: !!sessionId,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ foodItemId, quantity }: { foodItemId: number; quantity: number }) => {
      return await apiRequest("/api/cart", {
        method: "POST",
        body: {
          foodItemId,
          quantity,
          sessionId,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Berhasil",
        description: "Item berhasil ditambahkan ke keranjang!",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menambahkan item ke keranjang",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      return await apiRequest(`/api/cart/${cartItemId}`, {
        method: "PATCH",
        body: { quantity }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal mengupdate item",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      return await apiRequest(`/api/cart/${cartItemId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Berhasil",
        description: "Item berhasil dihapus dari keranjang",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menghapus item",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/cart/clear/${sessionId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Berhasil",
        description: "Keranjang berhasil dikosongkan",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal mengosongkan keranjang",
        variant: "destructive",
      });
    },
  });

  const addToCart = async (foodItemId: number, quantity = 1) => {
    await addToCartMutation.mutateAsync({ foodItemId, quantity });
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    await updateQuantityMutation.mutateAsync({ cartItemId, quantity });
  };

  const removeItem = async (cartItemId: number) => {
    await removeItemMutation.mutateAsync(cartItemId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  return (
    <CartContext.Provider
      value={{
        sessionId,
        cart,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}