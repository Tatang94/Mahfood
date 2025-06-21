import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  // Don't render footer on dashboard pages
  if (window.location.pathname.startsWith('/customer') || 
      window.location.pathname.startsWith('/driver') ||
      window.location.pathname.startsWith('/restaurant') ||
      window.location.pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">FoodieID</h3>
            <p className="text-gray-300 mb-4">
              Platform pengiriman makanan terpercaya di Indonesia. 
              Menghubungkan Anda dengan makanan terbaik di kota Anda.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Perusahaan</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Karir</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Mitra</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Layanan</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Pesan Makanan</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Lacak Pesanan</a></li>
              <li><a href="/help" className="text-gray-300 hover:text-primary transition-colors">Bantuan</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Feedback</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Kontak</h4>
            <ul className="space-y-2">
              <li className="text-gray-300 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                +62 821 1234 5678
              </li>
              <li className="text-gray-300 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                info@foodieid.com
              </li>
              <li className="text-gray-300 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">© 2024 FoodieID. Semua hak dilindungi undang-undang.</p>
        </div>
      </div>
    </footer>
  );
}
