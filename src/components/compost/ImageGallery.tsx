
"use client";

import type { CompostImage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Camera, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image"; 
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageGalleryProps {
  images: CompostImage[];
  onAddImage: (image: Omit<CompostImage, "id">) => void;
  onDeleteImage: (imageId: string) => void;
}

export default function ImageGallery({ images, onAddImage, onDeleteImage }: ImageGalleryProps) {
  const { toast } = useToast();
  const [imageToDelete, setImageToDelete] = useState<CompostImage | null>(null);
  const [caption, setCaption] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now()); 

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const placeholderUrl = `https://placehold.co/300x200.png?text=${encodeURIComponent(file.name.substring(0,15))}`;
      onAddImage({
        url: placeholderUrl,
        caption: caption || file.name,
        dateUploaded: new Date().toISOString(),
      });
      toast({ title: "Imagen Añadida (Marcador de posición)", description: `${file.name} añadida a la galería.` });
      setCaption(""); 
      setFileInputKey(Date.now()); 
    }
  };

  const handleTakePhotoMock = () => {
    toast({
      title: "¡Función Próximamente!",
      description: "Tomar fotos directamente desde la cámara aún no está implementado.",
      variant: "default",
    });
  };
  
  const confirmDeleteImage = () => {
    if (!imageToDelete) return;
    onDeleteImage(imageToDelete.id);
    toast({ title: "Imagen Eliminada", description: `Imagen "${imageToDelete.caption || 'Sin título'}" eliminada.`, variant: "destructive" });
    setImageToDelete(null);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary"/>Galería de Imágenes</CardTitle>
        <CardDescription>Realiza un seguimiento visual del progreso de tu composta.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-md space-y-3">
          <Label htmlFor="image-caption">Título de la Imagen (Opcional)</Label>
          <Input 
            id="image-caption" 
            value={caption} 
            onChange={(e) => setCaption(e.target.value)} 
            placeholder="ej: Semana 3 - Volteando la pila" 
          />
          <div className="flex gap-2">
            <Label htmlFor="file-upload" className="flex-1">
                <Button asChild className="w-full">
                    <span><UploadCloud className="mr-2 h-4 w-4" /> Subir Archivo</span>
                </Button>
                <Input id="file-upload" key={fileInputKey} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </Label>
            <Button variant="outline" onClick={handleTakePhotoMock} className="flex-1">
              <Camera className="mr-2 h-4 w-4" /> Tomar Foto (Simulacro)
            </Button>
          </div>
        </div>

        {images.length === 0 ? (
          <p className="text-muted-foreground text-center">Aún no se han subido imágenes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.slice().sort((a,b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime()).map((image) => (
              <Card key={image.id} className="overflow-hidden group relative">
                <NextImage
                  src={image.url}
                  alt={image.caption || "Imagen de composta"}
                  width={300}
                  height={200}
                  className="aspect-[3/2] w-full object-cover"
                  data-ai-hint="pila composta"
                />
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setImageToDelete(image)}
                    title="Eliminar Imagen"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <CardFooter className="p-3">
                  <div>
                    <p className="text-sm font-medium truncate" title={image.caption}>{image.caption || "Imagen sin título"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.dateUploaded).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      {imageToDelete && (
        <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta imagen?</AlertDialogTitle>
              <AlertDialogDescription>
                Imagen: "{imageToDelete.caption || 'Sin título'}". Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setImageToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteImage} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
