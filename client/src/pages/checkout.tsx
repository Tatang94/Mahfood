import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  ArrowLeft,
  Wallet,
  Building2,
  Phone,
  DollarSign,
  Shield
} from "lucide-react";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [orderData, setOrderData] = useState({
    deliveryAddress: "Jl. Sudirman No. 45, Jakarta Pusat",
    customerNotes: "",
    paymentMethod: "cod",
    phone: user?.phone || ""
  });

  const [userWallet, setUserWallet] = useState({ balance: 0, isActive: false });
  const [tasPayPin, setTasPayPin] = useState("");

  // Fetch user wallet data
  useEffect(() => {
    if (user?.id) {
      fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setUserWallet({ balance: data.balance || 0, isActive: data.isActive || false });
      })
      .catch(err => {
        console.error('Failed to fetch wallet:', err);
      });
    }
  }, [user?.id]);

  const [isProcessing, setIsProcessing] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/orders", {
        method: "POST",
        body: data
      });
    },
    onSuccess: (data) => {
      clearCart();
      toast({
        title: "Pesanan Berhasil!",
        description: "Pesanan Anda telah dikirim ke restoran",
      });
      
      // Redirect to order tracking
      setLocation(`/customer/dashboard?tab=orders&orderId=${data.id}`);
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat memproses pesanan",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan item ke keranjang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!orderData.phone) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon lengkapi nomor telepon",
        variant: "destructive",
      });
      return;
    }

    // Validate TasPay payment
    if (orderData.paymentMethod === "taspay") {
      if (!userWallet.isActive) {
        toast({
          title: "TasPay Belum Aktif",
          description: "Silakan aktifkan TasPay terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      if (userWallet.balance < (cart?.total || 0)) {
        toast({
          title: "Saldo Tidak Mencukupi",
          description: "Silakan top up saldo TasPay Anda",
          variant: "destructive",
        });
        return;
      }

      if (!tasPayPin || tasPayPin.length !== 6) {
        toast({
          title: "PIN Diperlukan",
          description: "Masukkan 6 digit PIN TasPay",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Get restaurant ID from first cart item - use hardcoded for now
      const restaurantId = 1;
      
      const orderPayload = {
        customerId: user?.id,
        restaurantId: restaurantId,
        totalAmount: cart.total,
        deliveryFee: cart.shipping,
        deliveryAddress: orderData.deliveryAddress,
        customerNotes: orderData.customerNotes,
        paymentMethod: orderData.paymentMethod,
        items: cart.items.map((item: any) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          price: item.foodItem?.price || 0
        }))
      };

      // Process TasPay payment first if selected
      if (orderData.paymentMethod === "taspay") {
        try {
          const paymentResponse = await fetch('/api/wallet/pay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              amount: cart.total,
              pin: tasPayPin,
              description: `Pembayaran pesanan makanan`
            })
          });

          if (!paymentResponse.ok) {
            const error = await paymentResponse.json();
            throw new Error(error.message || 'Pembayaran TasPay gagal');
          }

          const paymentData = await paymentResponse.json();
          
          // Update wallet balance
          setUserWallet(prev => ({ ...prev, balance: paymentData.balance }));
          
          toast({
            title: "Pembayaran Berhasil",
            description: `Saldo TasPay: ${formatCurrency(paymentData.balance)}`,
          });
        } catch (paymentError: any) {
          toast({
            title: "Pembayaran Gagal",
            description: paymentError.message,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      await createOrderMutation.mutateAsync(orderPayload);
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keranjang Kosong</h3>
            <p className="text-gray-600 mb-4">Tambahkan makanan ke keranjang terlebih dahulu</p>
            <Button onClick={() => setLocation('/menu')}>
              Jelajahi Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/customer')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Alamat Pengiriman</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    value={orderData.deliveryAddress}
                    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Masukkan alamat lengkap pengiriman..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={orderData.phone}
                    onChange={(e) => setOrderData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Catatan untuk Restoran</Label>
                  <Textarea
                    id="notes"
                    value={orderData.customerNotes}
                    onChange={(e) => setOrderData(prev => ({ ...prev, customerNotes: e.target.value }))}
                    placeholder="Contoh: Pedas sedang, tanpa bawang..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Metode Pembayaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={orderData.paymentMethod} 
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  {/* COD Payment */}
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="cod" id="cod" />
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <Label htmlFor="cod" className="font-medium">Bayar di Tempat (COD)</Label>
                      <p className="text-sm text-gray-500">Bayar tunai saat makanan diantar</p>
                    </div>
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Populer
                    </div>
                  </div>

                  {/* TasPay Digital Wallet */}
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="taspay" id="taspay" />
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <Label htmlFor="taspay" className="font-medium">TasPay</Label>
                      <p className="text-sm text-gray-500">Dompet digital khusus aplikasi</p>
                      <div className="text-xs text-blue-600 mt-1">
                        Saldo: {formatCurrency(userWallet.balance)}
                        {!userWallet.isActive && " (Belum aktif)"}
                      </div>
                    </div>
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Cepat & Aman
                    </div>
                  </div>


                </RadioGroup>

                {/* TasPay PIN Input */}
                {orderData.paymentMethod === "taspay" && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <Label className="font-medium text-blue-800">PIN TasPay</Label>
                    </div>
                    
                    {!userWallet.isActive ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Anda belum memiliki TasPay. Aktifkan sekarang untuk pembayaran yang lebih mudah!
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Fitur TasPay",
                              description: "Fitur aktivasi TasPay akan segera tersedia",
                            });
                          }}
                        >
                          Aktifkan TasPay
                        </Button>
                      </div>
                    ) : userWallet.balance < (cart?.total || 0) ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-red-600 mb-3">
                          Saldo TasPay tidak mencukupi. Saldo: {formatCurrency(userWallet.balance)}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Top Up TasPay",
                              description: "Fitur top up akan segera tersedia",
                            });
                          }}
                        >
                          Top Up Saldo
                        </Button>
                      </div>
                    ) : (
                      <Input
                        type="password"
                        placeholder="Masukkan 6 digit PIN TasPay"
                        value={tasPayPin}
                        onChange={(e) => setTasPayPin(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {cart.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.foodItem?.name}</p>
                          <p className="text-xs text-gray-600">{item.quantity}x {formatCurrency(item.foodItem?.price || 0)}</p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.total || 0)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cart.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ongkos Kirim</span>
                      <span>{formatCurrency(cart.shipping || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(cart.total || 0)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Estimasi pengiriman: 25-35 menit</span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Buat Pesanan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}