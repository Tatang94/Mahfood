import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onPhotoChange: (file: File | null, previewUrl: string | null) => void;
  currentPhoto?: string;
  className?: string;
  maxSize?: number; // in MB
  accept?: string;
  placeholder?: string;
}

export default function PhotoUpload({ 
  onPhotoChange, 
  currentPhoto, 
  className = "",
  maxSize = 5,
  accept = "image/*",
  placeholder = "Upload foto"
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: `Maksimal ukuran file ${maxSize}MB`,
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format file tidak didukung",
        description: "Harap upload file gambar (JPG, PNG, dll)",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onPhotoChange(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onPhotoChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {preview ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="relative group">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={triggerFileInput}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ganti
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={removePhoto}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`cursor-pointer transition-colors border-2 border-dashed ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
          onClick={triggerFileInput}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {placeholder}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Drag & drop foto di sini atau klik untuk pilih
              </p>
              <p className="text-xs text-gray-500">
                Format: JPG, PNG, GIF (Maks. {maxSize}MB)
              </p>
              <Button variant="outline" className="mt-4">
                <Upload className="w-4 h-4 mr-2" />
                Pilih Foto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}