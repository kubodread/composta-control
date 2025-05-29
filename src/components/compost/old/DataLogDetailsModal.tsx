
"use client";

import type { DataLog } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, FlaskConical, Zap, FileText, CalendarDays } from "lucide-react";

interface DataLogDetailsModalProps {
  log: DataLog;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; unit?: string }> = ({ icon, label, value, unit }) => (
  value !== undefined && value !== null && value !== "" ? (
    <div className="flex items-start space-x-3">
      <span className="text-primary mt-1">{icon}</span>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md text-foreground">
          {value} {unit}
        </p>
      </div>
    </div>
  ) : null
);


export default function DataLogDetailsModal({ log, isOpen, onOpenChange }: DataLogDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <CalendarDays className="h-5 w-5 text-primary" /> Detalles del Registro - {format(parseISO(log.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
            Parámetros detallados para esta entrada de datos de composta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem icon={<Thermometer size={18} />} label="Temperatura" value={log.temperature.toFixed(1)} unit="°C" />
            <DetailItem icon={<Droplets size={18} />} label="Humedad" value={log.humidity.toFixed(1)} unit="%" />
            {log.ph !== undefined && <DetailItem icon={<FlaskConical size={18} />} label="pH" value={log.ph.toFixed(1)} />}
            {log.ec !== undefined && <DetailItem icon={<Zap size={18} />} label="CE" value={log.ec.toFixed(2)} unit="dS/m" />}
          </div>
          
          {log.notes && (
            <DetailItem icon={<FileText size={18} />} label="Notas" value={log.notes} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
