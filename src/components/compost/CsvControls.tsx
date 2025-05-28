
"use client";

import type { DataLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, DownloadCloud } from "lucide-react";
import { parseISO, isValid, format, parse } from "date-fns"; // Added 'parse'
import { useState } from "react";

interface CsvControlsProps {
  profileName: string;
  dataLogs: DataLog[];
  onImportData: (importedLogs: DataLog[]) => void;
}

// Simple CSV parser
const parseCsv = (csvText: string): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return []; // Header + at least one data row

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j]?.trim() || "";
    }
    data.push(row);
  }
  return data;
};

// Tries to parse various common date formats using date-fns/parse
const parseDateFlexible = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === "") return null;

  // 1. Try ISO format first (covers YYYY-MM-DDTHH:mm:ss.sssZ, YYYY-MM-DD, etc.)
  let parsedDate = parseISO(dateString);
  if (isValid(parsedDate)) return parsedDate;

  // 2. List of common date formats to try with date-fns/parse.
  // Order might matter for ambiguous dates (e.g. 01/02/03).
  // More specific (e.g. 4-digit year) formats are generally good to try early.
  const formatStrings = [
    // Common with slashes - Year First
    'yyyy/MM/dd', 'yyyy/M/d',
    // Common with slashes - Month First
    'MM/dd/yyyy', 'M/d/yyyy',
    // Common with slashes - Day First
    'dd/MM/yyyy', 'd/M/yyyy',
    // Common with dashes - Year First
    'yyyy-MM-dd', 'yyyy-M-d',
    // Common with dashes - Month First
    'MM-dd-yyyy', 'M-d-yyyy',
    // Common with dashes - Day First
    'dd-MM-yyyy', 'd-M-yyyy',
    // Common with dots - Year First
    'yyyy.MM.dd', 'yyyy.M.d',
    // Common with dots - Month First
    'MM.dd.yyyy', 'M.d.yyyy',
    // Common with dots - Day First
    'dd.MM.yyyy', 'd.M.yyyy',
    // Two-digit years - slashes
    'yy/MM/dd', 'MM/dd/yy', 'dd/MM/yy',
    'yy/M/d', 'M/d/yy', 'd/M/yy',
    // Two-digit years - dashes
    'yy-MM-dd', 'MM-dd-yy', 'dd-MM-yy',
    'yy-M-d', 'M-d-yy', 'd-M-yy',
    // Two-digit years - dots
    'yy.MM.dd', 'MM.dd.yy', 'dd.MM.yy',
    'yy.M.d', 'M.d.yy', 'd.M.yy',
    // Date with time
    'yyyy-MM-dd HH:mm:ss', 'yyyy/MM/dd HH:mm:ss', 'dd/MM/yyyy HH:mm:ss', 'MM/dd/yyyy HH:mm:ss',
    'yyyy-MM-dd HH:mm', 'yyyy/MM/dd HH:mm', 'dd/MM/yyyy HH:mm', 'MM/dd/yyyy HH:mm',
    'yyyy-MM-dd h:mm a', 'yyyy/MM/dd h:mm a', 'dd/MM/yyyy h:mm a', 'MM/dd/yyyy h:mm a',
    // No separator
    'yyyyMMdd'
  ];

  const referenceDate = new Date(); // For parsing 'yy' formats correctly relative to current century

  for (const fmt of formatStrings) {
    parsedDate = parse(dateString, fmt, referenceDate);
    if (isValid(parsedDate)) {
      // Basic sanity check: if the format implies a 2-digit year (like 'yy/MM/dd'),
      // and the parsed year is far off (e.g., year 60 parsed as 0060 for 1960 or 2060),
      // it's likely correct. For ambiguous cases like 'M/d/y', `parse` does its best.
      return parsedDate;
    }
  }
  
  console.warn(`No se pudo analizar la fecha: "${dateString}" con los formatos probados.`);
  return null;
};


export default function CsvControls({ profileName, dataLogs, onImportData }: CsvControlsProps) {
  const { toast } = useToast();
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // To reset file input

  const handleExport = () => {
    if (dataLogs.length === 0) {
      toast({ title: "Sin Datos", description: "No hay datos para exportar.", variant: "default" });
      return;
    }

    const headers = ["Date", "Temperature_C", "Humidity_pc", "pH", "EC_dS_m", "Notes"];
    const csvRows = [
      headers.join(","),
      ...dataLogs.map((log) =>
        [
          format(parseISO(log.date), "yyyy-MM-dd HH:mm:ss"),
          log.temperature.toFixed(1),
          log.humidity.toFixed(1),
          log.ph?.toFixed(1) ?? "",
          log.ec?.toFixed(2) ?? "",
          `"${(log.notes || "").replace(/"/g, '""')}"`, 
        ].join(",")
      ),
    ];
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const safeProfileName = profileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `datos_composta_${safeProfileName}_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportación Exitosa", description: "Datos exportados a CSV." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsedData = parseCsv(text);
        const importedLogs: DataLog[] = parsedData.map((row, index) => {
          const dateValue = row.date || row.fecha;
          const date = parseDateFlexible(dateValue);
          if (!date) throw new Error(`Fecha inválida, faltante o en formato no reconocido ("${dateValue}") en la fila ${index + 2}.`);
          
          const temperature = parseFloat(row.temperature_c || row["temperatura (°c)"] || row.temperature);
          if (isNaN(temperature)) throw new Error(`Temperatura inválida o faltante en la fila ${index + 2}.`);

          const humidity = parseFloat(row.humidity_pc || row["humedad (%)"] || row.humidity);
          if (isNaN(humidity)) throw new Error(`Humedad inválida o faltante en la fila ${index + 2}.`);
          
          const phValue = row.ph ? parseFloat(row.ph) : undefined;
          const ecValue = row.ec_ds_m || row["ce (ds/m)"] ? parseFloat(row.ec_ds_m || row["ce (ds/m)"]) : undefined;

          return {
            id: crypto.randomUUID(), 
            date: date.toISOString(),
            temperature,
            humidity,
            ...(phValue !== undefined && !isNaN(phValue) && { ph: phValue }),
            ...(ecValue !== undefined && !isNaN(ecValue) && { ec: ecValue }),
            notes: row.notes || row.notas || "",
          };
        }).filter(log => log !== null) as DataLog[];
        
        onImportData(importedLogs);

      } catch (error: any) {
        console.error("Error de Importación CSV:", error);
        toast({ title: "Importación Fallida", description: error.message || "No se pudo analizar el archivo CSV. Verifica el formato y los datos.", variant: "destructive" });
      } finally {
        setFileInputKey(Date.now()); 
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <div>
        <h3 className="text-lg font-medium mb-2">Exportar Datos</h3>
        <p className="text-sm text-muted-foreground mb-3">Descarga todos los registros de datos para este perfil como un archivo CSV.</p>
        <Button onClick={handleExport} disabled={dataLogs.length === 0}>
          <DownloadCloud className="mr-2 h-4 w-4" /> Exportar a CSV
        </Button>
      </div>
      <hr />
      <div>
        <h3 className="text-lg font-medium mb-2">Importar Datos</h3>
        <p className="text-sm text-muted-foreground mb-1">Sube registros de datos desde un archivo CSV.</p>
        <p className="text-xs text-muted-foreground mb-3">Columnas esperadas (insensible a mayúsculas/minúsculas, variaciones comunes manejadas): Date/Fecha, Temperature_C/Temperatura (°C), Humidity_pc/Humedad (%), pH, EC_dS_m/CE (dS/m), Notes/Notas. La fecha puede estar en varios formatos comunes.</p>
        <Label htmlFor="csv-import" className="cursor-pointer">
            <Button asChild>
                <span><UploadCloud className="mr-2 h-4 w-4" /> Elegir Archivo CSV</span>
            </Button>
            <Input id="csv-import" type="file" accept=".csv" className="hidden" onChange={handleImport} key={fileInputKey} />
        </Label>
      </div>
    </div>
  );
}

