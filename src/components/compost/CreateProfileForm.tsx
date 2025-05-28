
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

interface CreateProfileFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateProfile: (name: string, initialComposition: string) => void;
}

export default function CreateProfileForm({ isOpen, onOpenChange, onCreateProfile }: CreateProfileFormProps) {
  const [name, setName] = useState("");
  const [initialComposition, setInitialComposition] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del perfil es obligatorio.");
      return;
    }
    if (!initialComposition.trim()) {
      setError("La composición inicial es obligatoria.");
      return;
    }
    onCreateProfile(name, initialComposition);
    setName("");
    setInitialComposition("");
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" /> Crear Nuevo Perfil de Composta
          </DialogTitle>
          <DialogDescription>
            Introduce los detalles para tu nueva pila de composta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Nombre del Perfil</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Pila Traspatio #1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initial-composition">Composición Inicial</Label>
            <Textarea
              id="initial-composition"
              value={initialComposition}
              onChange={(e) => setInitialComposition(e.target.value)}
              placeholder="ej: Restos de cocina, desechos de jardín, hojas"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {onOpenChange(false); setError(""); setName(""); setInitialComposition("")}}>
              Cancelar
            </Button>
            <Button type="submit">Crear Perfil</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
