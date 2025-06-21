import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, Search, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import LoginModal from "@/components/login-modal";
import SearchSuggestions from "@/components/search-suggestions";
import RoleMenu from "@/components/role-menu";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onCartToggle: () => void;
}

export default function Header({ onCartToggle }: HeaderProps) {
  const [location] = useLocation();
  const { cart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/menu?search=${encodeURIComponent(searchQuery)}`;
      setShowSearchSuggestions(false);
    }
  };

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    window.location.href = `/menu?search=${encodeURIComponent(query)}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl md:text-2xl font-bold text-primary cursor-pointer">
              FoodieID
            </Link>
            <Link href="/select-role" className="hidden sm:block ml-4">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Switch Role
              </Button>
            </Link>
          </div>
          
          {/* Desktop Navigation - Only show on landing pages */}
          {(!isAuthenticated || !user || user.role === 'customer') && (
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className={`transition-colors hover:text-primary ${
                location === "/" ? "text-primary font-medium" : "text-gray-700"
              }`}>
                Beranda
              </Link>
              <Link href="/menu" className={`transition-colors hover:text-primary ${
                location.startsWith("/menu") ? "text-primary font-medium" : "text-gray-700"
              }`}>
                Menu
              </Link>
              <Link href="/about" className={`transition-colors hover:text-primary ${
                location === "/about" ? "text-primary font-medium" : "text-gray-700"
              }`}>
                Tentang
              </Link>
              <Link href="/profile" className={`transition-colors hover:text-primary ${
                location === "/profile" ? "text-primary font-medium" : "text-gray-700"
              }`}>
                Profil
              </Link>
            </nav>
          )}

          {/* Search Bar - Only show for customer/guest */}
          {(!isAuthenticated || !user || user.role === 'customer') && (
            <div className="hidden lg:block flex-1 max-w-lg mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Cari makanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className="pl-10 pr-4"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <SearchSuggestions
                  isVisible={showSearchSuggestions}
                  onSearch={handleSearchSelect}
                  onClose={() => setShowSearchSuggestions(false)}
                />
              </form>
            </div>
          )}

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Cart Button - Only show for customer/guest */}
            {(!isAuthenticated || !user || user.role === 'customer') && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onCartToggle}
                className="relative h-10 w-10 md:h-9 md:w-9"
              >
                <ShoppingCart className="w-5 h-5 md:w-4 md:h-4" />
                {cart && cart.itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {cart.itemCount}
                  </Badge>
                )}
              </Button>
            )}
            
            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  Halo, {user.name}
                </span>
                {user.role === 'customer' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/customer'}
                  >
                    Dashboard
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                {/* Login Button - Desktop */}
                <Button 
                  className="hidden md:flex bg-primary hover:bg-primary/90 text-white text-sm px-3 py-2 h-9"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Masuk
                </Button>

                {/* Role Menu - Mobile & Desktop */}
                <RoleMenu className="md:hidden" />
              </>
            )}
          </div>
        </div>

        {/* Mobile Search - Only show for customer/guest */}
        {(!isAuthenticated || !user || user.role === 'customer') && (
          <div className="lg:hidden pb-4" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Cari makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <SearchSuggestions
                isVisible={showSearchSuggestions}
                onSearch={handleSearchSelect}
                onClose={() => setShowSearchSuggestions(false)}
              />
            </form>
          </div>
        )}
      </div>
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}
