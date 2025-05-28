
"use client";

import type { DataLog } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, Trash2 } from "lucide-react"; 
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import { useState } from "react";
import DataLogDetailsModal from "./DataLogDetailsModal";
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
import DataLogForm from "./DataLogForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DataLogTableProps {
  logs: DataLog[];
  onUpdateLog: (updatedLog: DataLog) => void;
  onDeleteLog: (logId: string) => void;
}

export default function DataLogTable({ logs, onUpdateLog, onDeleteLog }: DataLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<DataLog | null>(null);
  const [logToEdit, setLogToEdit] = useState<DataLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<DataLog | null>(null);
  const { toast } = useToast();

  const sortedLogs = [...logs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const handleEditSubmit = (updatedData: Omit<DataLog, "id">) => {
    if (logToEdit) {
      const fullyUpdatedLog = { ...logToEdit, ...updatedData };
      onUpdateLog(fullyUpdatedLog);
      setLogToEdit(null);
    }
  };

  const confirmDeleteLog = () => {
    if (!logToDelete) return;
    onDeleteLog(logToDelete.id);
    toast({ title: "Registro Eliminado", description: `El registro de datos del ${format(parseISO(logToDelete.date), "PPP", { locale: es })} ha sido eliminado.`, variant: "destructive" });
    setLogToDelete(null);
  };

  if (logs.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Aún no se han registrado datos.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Temp (°C)</TableHead>
            <TableHead>Humedad (%)</TableHead>
            <TableHead>pH</TableHead>
            <TableHead>CE (dS/m)</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{format(parseISO(log.date), "d MMM, yyyy", { locale: es })}</TableCell>
              <TableCell>{log.temperature.toFixed(1)}</TableCell>
              <TableCell>{log.humidity.toFixed(1)}</TableCell>
              <TableCell>{log.ph?.toFixed(1) ?? "-"}</TableCell>
              <TableCell>{log.ec?.toFixed(2) ?? "-"}</TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)} title="Ver Detalles">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setLogToEdit(log)} title="Editar Registro">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setLogToDelete(log)} title="Eliminar Registro">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedLog && (
        <DataLogDetailsModal
          log={selectedLog}
          isOpen={!!selectedLog}
          onOpenChange={() => setSelectedLog(null)}
        />
      )}
      
      {logToEdit && (
         <Dialog open={!!logToEdit} onOpenChange={() => setLogToEdit(null)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Registro de Datos - {format(parseISO(logToEdit.date), "PPP", { locale: es })}</DialogTitle>
                </DialogHeader>
                <DataLogForm 
                    onSubmit={handleEditSubmit} 
                    defaultValues={{
                        date: logToEdit.date,
                        temperature: logToEdit.temperature,
                        humidity: logToEdit.humidity,
                        ph: logToEdit.ph,
                        ec: logToEdit.ec,
                        notes: logToEdit.notes,
                    }}
                    isEditMode={true}
                />
            </DialogContent>
         </Dialog>
      )}

      {logToDelete && (
        <AlertDialog open={!!logToDelete} onOpenChange={() => setLogToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar este registro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El registro de datos del {format(parseISO(logToDelete.date), "PPP", { locale: es })} será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLogToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteLog} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
