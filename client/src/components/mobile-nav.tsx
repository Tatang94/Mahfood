import { Home, Search, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/useAuth";

interface MobileNavProps {
  onCartToggle: () => void;
}

export default function MobileNav({ onCartToggle }: MobileNavProps) {
  // Don't render mobile nav on dashboard pages
  if (window.location.pathname.startsWith('/customer') || 
      window.location.pathname.startsWith('/driver') ||
      window.location.pathname.startsWith('/restaurant') ||
      window.location.pathname.startsWith('/admin')) {
    return null;
  }
  const [location] = useLocation();
  const { cart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Only show mobile nav for guests and customers
  if (isAuthenticated && user && user.role !== 'customer') {
    return null;
  }

  const navItems = [
    { path: "/", icon: Home, label: "Beranda" },
    { path: "/menu", icon: Search, label: "Menu" },
    { path: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path === "/menu" && location.startsWith("/menu"));
          
          return (
            <Link key={item.path} href={item.path} className={`flex flex-col items-center justify-center h-full transition-colors mobile-touch-target ${
              isActive ? "text-primary" : "text-gray-500"
            }`}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Cart Button */}
        <button
          onClick={onCartToggle}
          className="flex flex-col items-center justify-center h-full text-gray-500 relative mobile-touch-target"
        >
          <ShoppingCart className="w-5 h-5 mb-1" />
          <span className="text-xs">Keranjang</span>
          {cart && cart.itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 right-6 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              {cart.itemCount}
            </Badge>
          )}
        </button>
      </div>
    </div>
  );
}