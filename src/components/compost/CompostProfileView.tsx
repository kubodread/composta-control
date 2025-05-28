
"use client";

import type { CompostProfile, DataLog, CompostImage, CNMaterial, CNMaterialInput } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { cnRatioMaterials } from "@/lib/cn-ratio-data";
import DataLogForm from "./DataLogForm";
import DataLogTable from "./DataLogTable";
import CompostCharts from "./CompostCharts";
import ImageGallery from "./ImageGallery";
import CsvControls from "./CsvControls";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Edit2, Trash2, PlusCircle, ChevronsUpDown, Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface CompostProfileViewProps {
  profile: CompostProfile;
  onUpdateProfile: (updatedProfile: CompostProfile) => void;
}

interface CNEditingState {
  initialComposition: string;
  materials: CNMaterialInput[];
  calculatedDisplayRatio: string; // For display like "25.3:1"
  cnRatioNotes: string;
}

// Helper to parse C:N ratio string like "X-Y:1" or "Z:1" into an average C value
const parseCNRatio = (ratioString: string): number => {
  const parts = ratioString.split(':');
  const cPart = parts[0];
  if (cPart.includes('-')) {
    const range = cPart.split('-').map(Number);
    return (range[0] + range[1]) / 2;
  }
  return Number(cPart);
};


export default function CompostProfileView({ profile, onUpdateProfile }: CompostProfileViewProps) {
  const { toast } = useToast();
  const [editingCN, setEditingCN] = useState(false);
  
  const [currentCNData, setCurrentCNData] = useState<CNEditingState>({
    initialComposition: profile.initialComposition || "",
    materials: profile.cnMaterialsUsed ? [...profile.cnMaterialsUsed.map(m => ({...m, quantity: Number(m.quantity)}))] : [],
    calculatedDisplayRatio: profile.calculatedCNRatio || "",
    cnRatioNotes: profile.cnRatioNotes || "",
  });

  // For adding new material
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<string>("1");


  useEffect(() => {
    setCurrentCNData({
      initialComposition: profile.initialComposition || "",
      materials: profile.cnMaterialsUsed ? [...profile.cnMaterialsUsed.map(m => ({...m, quantity: Number(m.quantity)}))] : [],
      calculatedDisplayRatio: profile.calculatedCNRatio || "",
      cnRatioNotes: profile.cnRatioNotes || "",
    });
  }, [profile, editingCN]); // also reset on edit mode change if not saving

  const handleInitialCompositionChange = (value: string) => {
    setCurrentCNData(prev => ({ ...prev, initialComposition: value }));
  };
  const handleCNNotesChange = (value: string) => {
    setCurrentCNData(prev => ({ ...prev, cnRatioNotes: value }));
  }

  const handleAddMaterialToList = () => {
    if (!selectedMaterialName || parseFloat(currentQuantity) <= 0) {
      toast({ title: "Error", description: "Selecciona un material y especifica una cantidad válida.", variant: "destructive" });
      return;
    }
    const materialExists = currentCNData.materials.find(m => m.name === selectedMaterialName);
    if (materialExists) {
        // Update quantity if material already exists
        const updatedMaterials = currentCNData.materials.map(m => 
            m.name === selectedMaterialName ? { ...m, quantity: m.quantity + parseFloat(currentQuantity) } : m
        );
        setCurrentCNData(prev => ({...prev, materials: updatedMaterials}));
    } else {
        // Add new material
        setCurrentCNData(prev => ({
            ...prev,
            materials: [...prev.materials, { name: selectedMaterialName, quantity: parseFloat(currentQuantity) }]
        }));
    }
    setSelectedMaterialName("");
    setCurrentQuantity("1");
  };

  const handleRemoveMaterialFromList = (materialName: string) => {
    setCurrentCNData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.name !== materialName)
    }));
  };

  const handleMaterialQuantityChange = (materialName: string, newQuantity: string) => {
    const quantityNum = parseFloat(newQuantity);
    setCurrentCNData(prev => ({
      ...prev,
      materials: prev.materials.map(m =>
        m.name === materialName ? { ...m, quantity: isNaN(quantityNum) || quantityNum < 0 ? 0 : quantityNum } : m
      )
    }));
  };

  const calculateAndSetOverallCNRatio = () => {
    if (currentCNData.materials.length === 0) {
      setCurrentCNData(prev => ({ ...prev, calculatedDisplayRatio: "" }));
      toast({ title: "Sin Materiales", description: "Añade materiales para calcular la relación C:N."});
      return;
    }

    let totalCarbon = 0;
    let totalNitrogen = 0;

    currentCNData.materials.forEach(item => {
      const materialDetails = cnRatioMaterials.find(m => m.name === item.name);
      if (materialDetails && item.quantity > 0) {
        const cValue = parseCNRatio(materialDetails.ratio); // N is 1
        totalCarbon += cValue * item.quantity;
        totalNitrogen += 1 * item.quantity; // Assuming N part of ratio is always 1 for these calcs
      }
    });

    if (totalNitrogen === 0) {
      setCurrentCNData(prev => ({ ...prev, calculatedDisplayRatio: "N/A (Nitrógeno es 0)" }));
      return;
    }

    const finalRatio = totalCarbon / totalNitrogen;
    setCurrentCNData(prev => ({ ...prev, calculatedDisplayRatio: `${finalRatio.toFixed(1)}:1` }));
    toast({ title: "Cálculo Realizado", description: `Relación C:N estimada: ${finalRatio.toFixed(1)}:1` });
  };


  const saveCNChanges = () => {
    // Calculate one last time before saving if not already calculated or if materials changed
    if (currentCNData.materials.length > 0 && !currentCNData.calculatedDisplayRatio.includes(":")) {
        calculateAndSetOverallCNRatio(); // This updates currentCNData.calculatedDisplayRatio
    }
    
    // Use a slight delay to ensure state update from calculateAndSetOverallCNRatio is processed if it was called
    setTimeout(() => {
        onUpdateProfile({
          ...profile,
          initialComposition: currentCNData.initialComposition,
          cnMaterialsUsed: currentCNData.materials.map(m => ({ name: m.name, quantity: Number(m.quantity) })), // Ensure quantity is number
          calculatedCNRatio: currentCNData.calculatedDisplayRatio,
          cnRatioNotes: currentCNData.cnRatioNotes,
        });
        setEditingCN(false);
        toast({ title: "Información C:N Actualizada", description: "La información de Carbono:Nitrógeno ha sido guardada." });
    }, 50); // Small delay to ensure calculatedDisplayRatio is updated
  };


  const handleAddDataLog = async (newDataLog: Omit<DataLog, "id">) => {
    const logWithId: DataLog = { ...newDataLog, id: crypto.randomUUID() };
    onUpdateProfile({ ...profile, dataLogs: [...profile.dataLogs, logWithId] });
  };

  const handleUpdateDataLog = (updatedLog: DataLog) => {
    onUpdateProfile({ ...profile, dataLogs: profile.dataLogs.map(log => log.id === updatedLog.id ? updatedLog : log) });
  };

  const handleDeleteDataLog = (logId: string) => {
    onUpdateProfile({ ...profile, dataLogs: profile.dataLogs.filter(log => log.id !== logId) });
  };

  const handleAddImage = (image: Omit<CompostImage, "id">) => {
    onUpdateProfile({ ...profile, images: [...profile.images, { ...image, id: crypto.randomUUID() }] });
  };

  const handleDeleteImage = (imageId: string) => {
    onUpdateProfile({ ...profile, images: profile.images.filter(img => img.id !== imageId) });
  };

  const handleImportData = (importedLogs: DataLog[]) => {
    const newLogs = [...profile.dataLogs, ...importedLogs.map(log => ({...log, id: crypto.randomUUID()}))]
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
    onUpdateProfile({ ...profile, dataLogs: newLogs });
    toast({ title: "Datos Importados", description: `${importedLogs.length} registros importados exitosamente.` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Relación Carbono:Nitrógeno (C:N)</CardTitle>
            <CardDescription>Gestiona la composición, añade materiales, calcula y guarda la relación C:N estimada.</CardDescription>
          </div>
          {!editingCN ? (
             <Button variant="outline" size="sm" onClick={() => setEditingCN(true)}><Edit2 className="mr-2 h-4 w-4" /> Editar Info C:N</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingCN(false); /* State reset by useEffect */ }}>Cancelar</Button>
              <Button size="sm" onClick={saveCNChanges}>Guardar Cambios</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editingCN ? (
            <>
              <div>
                <Label htmlFor="initial-composition">Descripción de la Composición Inicial</Label>
                <Textarea id="initial-composition" value={currentCNData.initialComposition} onChange={(e) => handleInitialCompositionChange(e.target.value)} placeholder="Describe los materiales con los que comenzaste." className="mt-1"/>
              </div>
              
              <div className="space-y-3 p-3 border rounded-md">
                <Label className="text-md font-medium">Añadir Materiales y Cantidades (en partes relativas)</Label>
                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Label htmlFor="select-material">Material</Label>
                    <Select value={selectedMaterialName} onValueChange={setSelectedMaterialName}>
                      <SelectTrigger id="select-material">
                        <SelectValue placeholder="Selecciona un material..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Ricos en Carbono (Marrones)</SelectLabel>
                          {cnRatioMaterials.filter(m => m.type === 'carbon').map(material => (
                            <SelectItem key={material.name} value={material.name}>
                              {material.name} ({material.ratio})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Ricos en Nitrógeno (Verdes)</SelectLabel>
                          {cnRatioMaterials.filter(m => m.type === 'nitrogen').map(material => (
                            <SelectItem key={material.name} value={material.name}>
                              {material.name} ({material.ratio})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label htmlFor="material-quantity">Cantidad</Label>
                    <Input id="material-quantity" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} placeholder="ej: 2" min="0.1" step="0.1"/>
                  </div>
                  <Button onClick={handleAddMaterialToList} size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4"/> Añadir
                  </Button>
                </div>
              </div>

              {currentCNData.materials.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-md font-medium">Materiales Añadidos:</Label>
                  <ul className="list-disc pl-5 space-y-1 text-sm max-h-48 overflow-y-auto">
                    {currentCNData.materials.map((item, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>
                          {item.name}: 
                          <Input 
                            type="number" 
                            value={item.quantity.toString()} 
                            onChange={(e) => handleMaterialQuantityChange(item.name, e.target.value)}
                            className="inline-block w-20 h-7 ml-2 mr-1 p-1 text-sm"
                            min="0"
                            step="0.1"
                          />
                           partes
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveMaterialFromList(item.name)}>
                          <Trash2 className="h-3 w-3 text-destructive"/>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={calculateAndSetOverallCNRatio} disabled={currentCNData.materials.length === 0}>
                <Calculator className="mr-2 h-4 w-4" /> Calcular Relación C:N
              </Button>
              {currentCNData.calculatedDisplayRatio && (
                <div>
                  <Label>Relación C:N Calculada:</Label>
                  <p className="text-lg font-semibold">{currentCNData.calculatedDisplayRatio}</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="cn-ratio-notes">Recomendaciones/Notas para Ajuste de C:N</Label>
                <Textarea id="cn-ratio-notes" value={currentCNData.cnRatioNotes} onChange={(e) => handleCNNotesChange(e.target.value)} placeholder="ej: Añadir más marrones para aumentar C, o verdes para N." className="mt-1"/>
              </div>
            </>
          ) : (
            <>
              <p><strong>Composición Inicial:</strong> {profile.initialComposition || "No establecido"}</p>
              {profile.cnMaterialsUsed && profile.cnMaterialsUsed.length > 0 && (
                <div>
                  <strong>Materiales Utilizados:</strong>
                  <ul className="list-disc pl-5 text-sm">
                    {profile.cnMaterialsUsed.map((item, index) => (
                      <li key={index}>{item.name}: {item.quantity} partes</li>
                    ))}
                  </ul>
                </div>
              )}
              <p><strong>Relación C:N Calculada:</strong> {profile.calculatedCNRatio || "No calculada o sin materiales"}</p>
              <p><strong>Notas de Ajuste C:N:</strong> {profile.cnRatioNotes || "No establecido"}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={['data-logging', 'data-history']} className="w-full">
        <AccordionItem value="data-logging">
          <AccordionTrigger className="text-xl font-semibold">Registrar Nueva Entrada de Datos</AccordionTrigger>
          <AccordionContent>
            <DataLogForm onSubmit={handleAddDataLog} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="data-history">
          <AccordionTrigger className="text-xl font-semibold">Historial y Análisis de Datos</AccordionTrigger>
          <AccordionContent>
            <DataLogTable
              logs={profile.dataLogs}
              onUpdateLog={handleUpdateDataLog}
              onDeleteLog={handleDeleteDataLog}
            />
          </AccordionContent>
        </AccordionItem>

        {profile.dataLogs.length > 0 && (
          <AccordionItem value="charts">
            <AccordionTrigger className="text-xl font-semibold">Gráficos de Datos de Composta</AccordionTrigger>
            <AccordionContent>
              <CompostCharts logs={profile.dataLogs} profileColor={profile.color} />
            </AccordionContent>
          </AccordionItem>
        )}
        
        <AccordionItem value="image-gallery">
          <AccordionTrigger className="text-xl font-semibold">Galería de Seguimiento Visual</AccordionTrigger>
          <AccordionContent>
            <ImageGallery
              images={profile.images}
              onAddImage={handleAddImage}
              onDeleteImage={handleDeleteImage}
            />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="csv-controls">
          <AccordionTrigger className="text-xl font-semibold">Importar/Exportar Datos</AccordionTrigger>
          <AccordionContent>
            <CsvControls
              profileName={profile.name}
              dataLogs={profile.dataLogs}
              onImportData={handleImportData}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
