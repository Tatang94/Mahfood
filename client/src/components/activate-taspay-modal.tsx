import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Wallet } from "lucide-react";

interface ActivateTasPayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivateTasPayModal({ isOpen, onClose }: ActivateTasPayModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  const queryClient = useQueryClient();

  // Activate TasPay mutation
  const activateMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await fetch("/api/wallet/activate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pin }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setPin("");
      setConfirmPin("");
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin !== confirmPin) {
      return;
    }
    
    activateMutation.mutate(pin);
  };

  const isValidPin = pin.length === 6 && /^\d{6}$/.test(pin);
  const pinsMatch = pin === confirmPin;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-600" />
            Aktifkan TasPay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Selamat Datang di TasPay!</h3>
            <p className="text-sm text-gray-600">
              Buat PIN 6 digit untuk mengamankan dompet digital Anda. 
              PIN ini akan digunakan untuk setiap transaksi TasPay.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pin">PIN TasPay (6 digit)</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Masukkan 6 digit angka"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                required
              />
              {pin.length > 0 && !isValidPin && (
                <p className="text-xs text-red-600 mt-1">PIN harus 6 digit angka</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPin">Konfirmasi PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="Masukkan ulang PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                required
              />
              {confirmPin.length > 0 && !pinsMatch && (
                <p className="text-xs text-red-600 mt-1">PIN tidak sama</p>
              )}
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-blue-800">
                <strong>Tips Keamanan:</strong>
                <ul className="mt-2 text-xs space-y-1">
                  <li>• Jangan gunakan PIN yang mudah ditebak (123456, tanggal lahir)</li>
                  <li>• Jangan berikan PIN kepada siapapun</li>
                  <li>• PIN akan ter-enkripsi dengan aman di sistem kami</li>
                </ul>
              </AlertDescription>
            </Alert>

            {activateMutation.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {activateMutation.error.message}
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
                disabled={!isValidPin || !pinsMatch || activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengaktifkan...
                  </>
                ) : (
                  "Aktifkan TasPay"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}