import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PhotoUpload from "@/components/photo-upload";
import { Plus } from "lucide-react";

interface AddMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
}

export default function AddMenuModal({ isOpen, onClose, restaurantId }: AddMenuModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    photoFile: null as File | null,
    photoPreview: null as string | null
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const addMenuMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      formDataToSend.append("name", data.name);
      formDataToSend.append("description", data.description);
      formDataToSend.append("price", data.price);
      formDataToSend.append("categoryId", data.categoryId);
      formDataToSend.append("restaurantId", restaurantId.toString());
      
      if (data.photoFile) {
        formDataToSend.append("photo", data.photoFile);
      }

      return apiRequest(`/api/restaurants/${restaurantId}/menu`, {
        method: "POST",
        body: formDataToSend,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "menu"] });
      toast({ title: "Menu berhasil ditambahkan" });
      handleClose();
    },
    onError: () => {
      toast({ 
        title: "Gagal menambahkan menu", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: "Data tidak lengkap",
        description: "Nama, harga, dan kategori harus diisi",
        variant: "destructive"
      });
      return;
    }

    addMenuMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      photoFile: null,
      photoPreview: null
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Menu Baru</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Menu</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Nasi Gudeg Yogya"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Deskripsi menu..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="price">Harga (Rp)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="25000"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Foto Menu</Label>
            <PhotoUpload
              onPhotoChange={(file, preview) => 
                setFormData({...formData, photoFile: file, photoPreview: preview})
              }
              currentPhoto={formData.photoPreview}
              placeholder="Upload foto menu"
              maxSize={3}
              className="mt-2"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={addMenuMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {addMenuMutation.isPending ? "Menyimpan..." : "Tambah Menu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}