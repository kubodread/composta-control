
"use client";

import type { CompostProfile } from "@/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import CreateProfileForm from "./CreateProfileForm";
import CompostProfileView from "./CompostProfileView";
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
import { useToast } from "@/hooks/use-toast";

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function CompostProfileManager() {
  const [profiles, setProfiles] = useLocalStorage<CompostProfile[]>("compostProfiles", []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [profileToDelete, setProfileToDelete] = useState<CompostProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profiles.length > 0 && !activeTab) {
      setActiveTab(profiles[0].id);
    } else if (profiles.length === 0) {
      setActiveTab(undefined);
    }
  }, [profiles, activeTab]);

  const handleCreateProfile = (name: string, initialComposition: string) => {
    const newProfile: CompostProfile = {
      id: crypto.randomUUID(),
      name,
      initialComposition,
      color: getRandomColor(),
      dataLogs: [],
      images: [],
      createdAt: new Date().toISOString(),
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setActiveTab(newProfile.id);
    setIsCreateModalOpen(false);
    toast({ title: "Perfil Creado", description: `El perfil "${name}" ha sido creado exitosamente.` });
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setProfileToDelete(profile);
    }
  };

  const confirmDeleteProfile = () => {
    if (!profileToDelete) return;
    const updatedProfiles = profiles.filter((p) => p.id !== profileToDelete.id);
    setProfiles(updatedProfiles);
    toast({ title: "Perfil Eliminado", description: `El perfil "${profileToDelete.name}" ha sido eliminado.`, variant: "destructive" });
    setProfileToDelete(null);
    if (activeTab === profileToDelete.id) {
      setActiveTab(updatedProfiles.length > 0 ? updatedProfiles[0].id : undefined);
    }
  };
  
  const updateProfile = (updatedProfile: CompostProfile) => {
    setProfiles(prevProfiles => 
      prevProfiles.map(p => p.id === updatedProfile.id ? updatedProfile : p)
    );
  };


  if (profiles.length === 0 && !isCreateModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <h2 className="text-2xl font-semibold mb-4">Aún no Hay Perfiles de Composta</h2>
        <p className="text-muted-foreground mb-6">
          Comienza creando tu primer perfil de pila de composta.
        </p>
        <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Perfil
        </Button>
        <CreateProfileForm
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateProfile={handleCreateProfile}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Tus Pilas de Composta</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Perfil
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="overflow-x-auto whitespace-nowrap">
          {profiles.map((profile) => (
            <div key={profile.id} className="relative group flex items-center">
              <TabsTrigger value={profile.id} className="pr-8">
                <span style={{ color: profile.color, marginRight: '0.5rem', fontSize: '1.5rem' }}>●</span>
                {profile.name}
              </TabsTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-50 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                aria-label={`Eliminar perfil ${profile.name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </TabsList>
        {profiles.map((profile) => (
          <TabsContent key={profile.id} value={profile.id}>
            <CompostProfileView profile={profile} onUpdateProfile={updateProfile} />
          </TabsContent>
        ))}
      </Tabs>

      <CreateProfileForm
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateProfile={handleCreateProfile}
      />

      {profileToDelete && (
        <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar "{profileToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Todos los datos asociados con este perfil serán eliminados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteProfile} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
