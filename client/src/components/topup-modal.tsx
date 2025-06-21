import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Smartphone, Building, QrCode } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentMethod {
  code: string;
  name: string;
  fee: number;
}

interface TopUpData {
  amount: number;
  paymentMethod: string;
  pin: string;
}

export default function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [pin, setPin] = useState("");
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const queryClient = useQueryClient();

  // Get payment methods
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const response = await fetch("/api/wallet/payment-methods");
      if (!response.ok) throw new Error("Gagal mengambil metode pembayaran");
      return response.json();
    },
  });

  // Create top up transaction
  const createTopUpMutation = useMutation({
    mutationFn: async (data: TopUpData) => {
      const response = await fetch("/api/wallet/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentTransaction(data.transaction);
    },
  });

  // Check transaction status
  const checkStatusMutation = useMutation({
    mutationFn: async (uniqueCode: string) => {
      const response = await fetch("/api/wallet/topup/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        setCurrentTransaction(null);
        setAmount("");
        setSelectedMethod("");
        setPin("");
        onClose();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTopUpMutation.mutate({
      amount: parseInt(amount),
      paymentMethod: selectedMethod,
      pin: pin,
    });
  };

  const handleCheckStatus = () => {
    if (currentTransaction?.unique_code) {
      setIsChecking(true);
      checkStatusMutation.mutate(currentTransaction.unique_code);
      setTimeout(() => setIsChecking(false), 2000);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getMethodIcon = (code: string) => {
    if (code === '13') return <Smartphone className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Top Up TasPay</DialogTitle>
        </DialogHeader>

        {!currentTransaction ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Jumlah Top Up</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Minimum Rp 10.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10000"
                step="1000"
                required
              />
            </div>

            <div>
              <Label>Metode Pembayaran</Label>
              <div className="grid gap-2 mt-2">
                {paymentMethods.map((method) => (
                  <Card 
                    key={method.code}
                    className={`cursor-pointer transition-colors ${
                      selectedMethod === method.code 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod(method.code)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getMethodIcon(method.code)}
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-gray-500">
                              Biaya: {typeof method.fee === 'number' && method.fee < 1 
                                ? `${method.fee}%` 
                                : formatPrice(method.fee)
                              }
                            </div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedMethod === method.code
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-300'
                        }`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="pin">PIN TasPay</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Masukkan PIN 6 digit"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            {createTopUpMutation.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {createTopUpMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={createTopUpMutation.isPending || !amount || !selectedMethod || !pin}
              >
                {createTopUpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Buat Transaksi"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                Transaksi berhasil dibuat. Selesaikan pembayaran untuk menambah saldo TasPay.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-semibold">{formatPrice(currentTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya:</span>
                  <span>{formatPrice(currentTransaction.fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode:</span>
                  <span>{currentTransaction.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Berlaku hingga:</span>
                  <span className="text-sm">{new Date(currentTransaction.expired).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {currentTransaction.qr_url && (
              <div className="text-center">
                <img 
                  src={currentTransaction.qr_url} 
                  alt="QR Code Pembayaran"
                  className="mx-auto w-48 h-48 border rounded"
                />
                <p className="text-sm text-gray-600 mt-2">Scan QR Code untuk pembayaran</p>
              </div>
            )}

            <Button
              onClick={() => window.open(currentTransaction.checkout_url, '_blank')}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Buka Halaman Pembayaran
            </Button>

            {checkStatusMutation.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {checkStatusMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Tutup
              </Button>
              <Button 
                onClick={handleCheckStatus}
                className="flex-1 bg-green-500 hover:bg-green-600"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengecek...
                  </>
                ) : (
                  "Cek Status"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}