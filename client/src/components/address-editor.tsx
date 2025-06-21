import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SimpleMap from "@/components/simple-map";
import { MapPin, Save, X, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Address {
  id?: number;
  name: string;
  address: string;
  coordinates: [number, number];
  isDefault: boolean;
}

interface AddressEditorProps {
  address?: Address;
  onSave: (address: Address) => void;
  onCancel: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddressEditor({ 
  address, 
  onSave, 
  onCancel, 
  isOpen, 
  onOpenChange 
}: AddressEditorProps) {
  const [formData, setFormData] = useState<Address>({
    name: address?.name || '',
    address: address?.address || '',
    coordinates: address?.coordinates || [-7.3274, 108.2207],
    isDefault: address?.isDefault || false
  });
  
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        address: address.address,
        coordinates: address.coordinates,
        isDefault: address.isDefault
      });
    }
  }, [address]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, coordinates: [lat, lng] }));
    
    // Reverse geocoding to get address from coordinates
    setIsLoadingAddress(true);
    try {
      // Using Nominatim for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setFormData(prev => ({ 
          ...prev, 
          address: data.display_name,
          coordinates: [lat, lng]
        }));
        toast({
          title: "Alamat Ditemukan",
          description: "Alamat berhasil diperbarui dari lokasi peta",
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast({
        title: "Info",
        description: "Tidak dapat mengambil alamat otomatis, silakan masukkan manual",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleAddressChange = async (addressText: string) => {
    setFormData(prev => ({ ...prev, address: addressText }));
    
    // Optional: Geocoding to get coordinates from address - with proper error handling
    if (addressText.length > 15) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&limit=1&countrycodes=id`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              setFormData(prev => ({ ...prev, coordinates: [lat, lng] }));
            }
          }
        }
      } catch (error) {
        // Silent fail for geocoding to avoid console errors
      }
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.address) {
      toast({
        title: "Validasi Error",
        description: "Nama dan alamat harus diisi",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    onOpenChange(false);
    toast({
      title: "Berhasil",
      description: "Alamat berhasil disimpan",
    });
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>{address?.id ? 'Edit Alamat' : 'Tambah Alamat Baru'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Alamat</Label>
              <Input
                id="name"
                placeholder="e.g. Rumah, Kantor, Kos"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                placeholder="Masukkan alamat lengkap..."
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                rows={4}
                disabled={isLoadingAddress}
              />
              {isLoadingAddress && (
                <p className="text-sm text-gray-500 mt-1">Mengambil alamat dari peta...</p>
              )}
            </div>
            
            <div>
              <Label>Koordinat</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={formData.coordinates[0].toFixed(6)}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, coordinates: [lat, prev.coordinates[1]] }));
                  }}
                />
                <Input
                  placeholder="Longitude"
                  value={formData.coordinates[1].toFixed(6)}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, coordinates: [prev.coordinates[0], lng] }));
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isDefault">Jadikan alamat utama</Label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
            </div>
          </div>
          
          {/* Map Section */}
          <div>
            <Label className="block mb-2">Pilih Lokasi di Peta</Label>
            <Card>
              <CardContent className="p-4">
                <SimpleMap
                  center={formData.coordinates}
                  zoom={16}
                  height="350px"
                  markers={[
                    {
                      position: formData.coordinates,
                      popup: formData.name || "Lokasi Alamat",
                      icon: "📍",
                      color: "#ef4444"
                    }
                  ]}
                  onLocationSelect={handleLocationSelect}
                  showGpsButton={true}
                  interactive={true}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Klik pada peta untuk memilih lokasi yang tepat. Alamat akan diperbarui otomatis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}