import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search, Clock } from "lucide-react";

interface SearchSuggestionsProps {
  isVisible: boolean;
  onSearch: (query: string) => void;
  onClose: () => void;
}

export default function SearchSuggestions({ isVisible, onSearch, onClose }: SearchSuggestionsProps) {
  const trendingSearches = [
    "Gudeg Yogyakarta",
    "Nasi Padang",
    "Mie Ayam",
    "Sate Ayam",
    "Rawon Surabaya"
  ];

  const recentSearches = [
    "Gado-gado",
    "Bebek goreng",
    "Nasi liwet"
  ];

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2">
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Trending Searches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">Pencarian Populer</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                    onClick={() => {
                      onSearch(search);
                      onClose();
                    }}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Pencarian Terakhir</h3>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => {
                        onSearch(search);
                        onClose();
                      }}
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{search}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Categories */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Kategori Cepat</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onSearch("makanan tradisional");
                    onClose();
                  }}
                >
                  Makanan Tradisional
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onSearch("makanan cepat");
                    onClose();
                  }}
                >
                  Makanan Cepat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onSearch("minuman");
                    onClose();
                  }}
                >
                  Minuman
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onSearch("dessert");
                    onClose();
                  }}
                >
                  Dessert
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}