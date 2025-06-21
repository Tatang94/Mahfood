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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-orange-600" />
            Aktifkan TasPay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-center py-2">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Selamat Datang di TasPay!</h3>
            <p className="text-xs text-gray-600">
              Buat PIN 6 digit untuk mengamankan dompet digital Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="pin" className="text-sm">PIN TasPay (6 digit)</Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest h-12"
                required
              />
              {pin.length > 0 && !isValidPin && (
                <p className="text-xs text-red-600 mt-1">PIN harus 6 digit angka</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPin" className="text-sm">Konfirmasi PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="••••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest h-12"
                required
              />
              {confirmPin.length > 0 && !pinsMatch && (
                <p className="text-xs text-red-600 mt-1">PIN tidak sama</p>
              )}
            </div>

            <Alert className="border-blue-200 bg-blue-50 py-2">
              <AlertDescription className="text-blue-800 text-xs">
                <strong>Tips:</strong> Jangan gunakan PIN yang mudah ditebak dan jangan berikan kepada siapapun.
              </AlertDescription>
            </Alert>

            {activateMutation.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {activateMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-10">
                Batal
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-orange-500 hover:bg-orange-600 h-10"
                disabled={!isValidPin || !pinsMatch || activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengaktifkan...
                  </>
                ) : (
                  "Aktifkan"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}