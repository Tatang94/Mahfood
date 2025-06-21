import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import FoodCard from "@/components/food-card";
import { Search, Filter } from "lucide-react";
import type { Category, FoodItem } from "@shared/schema";

export default function Menu() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryFromUrl = urlParams.get('category');
  const searchFromUrl = urlParams.get('search');
  
  // Set initial states from URL
  useState(() => {
    if (categoryFromUrl) setSelectedCategory(parseInt(categoryFromUrl));
    if (searchFromUrl) setSearchQuery(searchFromUrl);
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: foodItems, isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items", { 
      category: selectedCategory, 
      search: searchQuery 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory.toString());
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      
      const response = await fetch(`/api/food-items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch food items');
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be handled by the query effect
  };

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Menu Makanan</h1>
          <p className="text-gray-600">Pilih makanan favorit Anda dari berbagai kategori</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder="Cari makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </form>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
              className={selectedCategory === null ? "bg-primary hover:bg-primary/90" : ""}
            >
              Semua
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(category.id)}
                className={selectedCategory === category.id ? "bg-primary hover:bg-primary/90" : ""}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm">
              Hasil pencarian untuk "{searchQuery}": {foodItems?.length || 0} item
            </Badge>
          </div>
        )}

        {/* Food Items Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !foodItems || foodItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak ada makanan ditemukan
            </h3>
            <p className="text-gray-600 mb-4">
              Coba ubah filter atau kata kunci pencarian Anda
            </p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }}>
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {foodItems.map((item) => (
              <FoodCard key={item.id} foodItem={item} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {foodItems && foodItems.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Muat Lebih Banyak
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
