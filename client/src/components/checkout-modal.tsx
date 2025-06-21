import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MapPin, CreditCard, Truck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import OrderTracking from "@/components/order-tracking";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [userWallet, setUserWallet] = useState({ balance: 0, isActive: false });
  const [tasPayPin, setTasPayPin] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const { cart, clearCart } = useCart();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulasi pemrosesan pesanan
    setTimeout(async () => {
      const newOrderId = `ORD${Date.now().toString().slice(-6)}`;
      setOrderId(newOrderId);
      await clearCart();
      setIsProcessing(false);
      toast({
        title: "Pesanan Berhasil!",
        description: `Pesanan Anda telah diterima. ID: ${newOrderId}`,
      });
      onClose();
      setIsTrackingOpen(true);
    }, 2000);
  };

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Checkout Pesanan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleOrder} className="space-y-6">
          {/* Alamat Pengiriman */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Alamat Pengiriman</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Penerima</Label>
                <Input id="name" placeholder="Nama lengkap" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input id="phone" type="tel" placeholder="08123456789" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea 
                id="address" 
                placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                rows={3}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Pakai sendok plastik, pedas sedang, dll."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Metode Pembayaran */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Metode Pembayaran</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Bayar di Tempat (COD)</div>
                  <div className="text-sm text-gray-500">Bayar tunai saat makanan diantar</div>
                </div>
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Populer
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="taspay"
                  checked={paymentMethod === "taspay"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">TasPay</div>
                  <div className="text-sm text-gray-500">Dompet digital khusus aplikasi</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Saldo: {formatPrice(userWallet.balance)}
                    {!userWallet.isActive && " (Belum aktif)"}
                  </div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Cepat & Aman
                </div>
              </label>
              

            </div>
          </div>

          <Separator />

          {/* Ringkasan Pesanan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Ringkasan Pesanan</h3>
            </div>
            
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-medium">{item.foodItem?.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-medium">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkir:</span>
                <span>{formatPrice(cart.shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isProcessing}
            >
              {isProcessing ? "Memproses..." : `Pesan Sekarang - ${formatPrice(cart.total)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      <OrderTracking 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        orderId={orderId || undefined}
      />
    </Dialog>
  );
}