
"use client";

import type { DataLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, DownloadCloud } from "lucide-react";
import { parseISO, isValid, format, parse } from "date-fns";
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

interface ParsedDateResult {
  date: Date | null;
  formatUsed: string | null; // 'ISO' o la cadena de formato de date-fns
}

// Tries to parse various common date formats using date-fns/parse
// This function now returns the date and the format string that succeeded.
const attemptParseDateWithFormats = (dateString: string): ParsedDateResult => {
  if (!dateString || dateString.trim() === "") return { date: null, formatUsed: null };

  // 1. Try ISO format first
  let parsedDate = parseISO(dateString);
  if (isValid(parsedDate)) return { date: parsedDate, formatUsed: 'ISO' };

  // 2. List of common date formats to try with date-fns/parse.
  const formatStrings = [
    'yyyy-MM-dd HH:mm:ss', 'yyyy/MM/dd HH:mm:ss', 'dd/MM/yyyy HH:mm:ss', 'MM/dd/yyyy HH:mm:ss',
    'yyyy-MM-dd HH:mm', 'yyyy/MM/dd HH:mm', 'dd/MM/yyyy HH:mm', 'MM/dd/yyyy HH:mm',
    'yyyy-MM-dd', 'yyyy/MM/dd', 'yyyy.MM.dd',
    'dd/MM/yyyy', 'd/M/yyyy', 
    'MM/dd/yyyy', 'M/d/yyyy',
    'dd-MM-yyyy', 'd-M-yyyy', 
    'MM-dd-yyyy', 'M-d-yyyy',
    'dd.MM.yyyy', 'd.M.yyyy',
    'MM.dd.yyyy', 'M.d.yyyy',
    'dd/MM/yy HH:mm', 'MM/dd/yy HH:mm',
    'dd/MM/yy', 'd/M/yy', 
    'MM/dd/yy', 'M/d/yy',
    'yyyyMMdd'
  ];

  const referenceDate = new Date(); 

  for (const fmt of formatStrings) {
    parsedDate = parse(dateString, fmt, referenceDate);
    if (isValid(parsedDate)) {
      // Additional check for ambiguous d/M vs M/d formats
      if ((fmt.includes("d") || fmt.includes("D")) && (fmt.includes("m") || fmt.includes("M"))) {
         // Simple heuristic: if a part is > 12, it's likely a day or year, not a month.
         // This helps distinguish DD/MM from MM/DD if one of the first two parts is > 12.
         const dateParts = dateString.replace(/[^\d\w]/g, '-').split('-'); // Split by common delimiters
         if (dateParts.length >=2) {
            const p1 = parseInt(dateParts[0]);
            const p2 = parseInt(dateParts[1]);

            // If format starts with 'd', p1 should be day. If p1 > 12 and parsedDate.getDate() is not p1, this format is likely wrong.
            if (fmt.toLowerCase().startsWith('d')) { // day first
                if (p1 > 12 && p1 !== parsedDate.getDate()) continue; // p1 is a day > 12, but parsed date doesn't match
                if (p2 > 12 && p2 !== (parsedDate.getMonth()+1)) continue; // p2 is a month > 12 (impossible unless it's year part, handled by format)
            } else if (fmt.toLowerCase().startsWith('m')) { // month first
                if (p1 > 12 && p1 !== (parsedDate.getMonth()+1)) continue; // p1 is a month > 12 (impossible)
                if (p2 > 12 && p2 !== parsedDate.getDate()) continue; // p2 is a day > 12, but parsed date doesn't match
            }
         }
      }
      return { date: parsedDate, formatUsed: fmt };
    }
  }
  console.warn(`No se pudo analizar la fecha: "${dateString}" con los formatos probados.`);
  return { date: null, formatUsed: null };
};


export default function CsvControls({ profileName, dataLogs, onImportData }: CsvControlsProps) {
  const { toast } = useToast();
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Used to reset file input

  const handleExport = () => {
    if (dataLogs.length === 0) {
      toast({ title: "Sin Datos", description: "No hay datos para exportar.", variant: "default" });
      return;
    }

    const headers = ["Date", "Temperature_C", "Humidity_pc", "pH", "EC_dS_m", "AmbientTemperature_C", "Notes"];
    const csvRows = [
      headers.join(","),
      ...dataLogs.map((log) =>
        [
          format(parseISO(log.date), "yyyy-MM-dd HH:mm:ss"), // Consistent export format
          log.temperature.toFixed(1),
          log.humidity.toFixed(1),
          log.ph?.toFixed(1) ?? "",
          log.ec?.toFixed(2) ?? "",
          log.ambientTemperature?.toFixed(1) ?? "",
          `"${(log.notes || "").replace(/"/g, '""')}"`, // Escape quotes in notes
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
        const allCsvRows = parseCsv(text);
        if (allCsvRows.length === 0) {
          toast({ title: "Archivo Vacío o Inválido", description: "El archivo CSV no contiene datos o tiene un formato incorrecto.", variant: "destructive" });
          setFileInputKey(Date.now());
          return;
        }

        // --- Date format deduction logic ---
        const sampleSize = Math.min(10, allCsvRows.length); // Analyze up to 10 rows
        const sampleRows = allCsvRows.slice(0, sampleSize);
        const formatCounts: Record<string, number> = {};
        let successfullyParsedSampleCount = 0;

        for (const row of sampleRows) {
          const dateValue = row.date || row.fecha;
          if (dateValue && dateValue.trim() !== "") {
            const { formatUsed } = attemptParseDateWithFormats(dateValue);
            if (formatUsed) {
              formatCounts[formatUsed] = (formatCounts[formatUsed] || 0) + 1;
              successfullyParsedSampleCount++;
            }
          }
        }
        
        let deducedFormat: string | null = null;
        if (successfullyParsedSampleCount > 0 && Object.keys(formatCounts).length > 0) {
          // Find the format with the highest count in the sample
          deducedFormat = Object.keys(formatCounts).reduce((a, b) => formatCounts[a] > formatCounts[b] ? a : b);
        } else if (successfullyParsedSampleCount === 0 && sampleRows.length > 0) {
             // No date in sample could be parsed
             toast({ title: "Formato de Fecha No Reconocido", description: "No se pudo reconocer el formato de fecha en las filas de muestra. Por favor, verifica la columna de fecha.", variant: "destructive", duration: 7000 });
             setFileInputKey(Date.now()); // Reset file input
             return;
        }

        // If no format could be deduced (e.g., empty date column in sample), raise error.
        if (!deducedFormat) { 
          toast({ title: "Formato de Fecha Indeterminado", description: "No se pudo determinar un formato de fecha consistente. Revisa tu archivo CSV.", variant: "destructive" });
          setFileInputKey(Date.now());
          return;
        }
        
        toast({ title: "Formato de Fecha Detectado", description: `Se usará el formato: ${deducedFormat === 'ISO' ? 'ISO 8601 (ej: YYYY-MM-DD)' : deducedFormat}` });
        // --- End of date format deduction ---

        const importedLogs: DataLog[] = allCsvRows.map((row, index) => {
          const dateValue = row.date || row.fecha;
          let parsedDateObj: Date | null = null;
          const referenceDate = new Date(); // Needed for `parse`

          if (!dateValue || dateValue.trim() === "") {
            throw new Error(`Valor de fecha faltante en la fila ${index + 2}.`);
          }

          // Attempt to parse with the deduced format
          if (deducedFormat === 'ISO') {
            parsedDateObj = parseISO(dateValue);
          } else {
            parsedDateObj = parse(dateValue, deducedFormat, referenceDate);
          }

          // If deduced format fails for a specific row, try flexible parsing as a fallback
          if (!parsedDateObj || !isValid(parsedDateObj)) {
            const flexibleResult = attemptParseDateWithFormats(dateValue);
            if (flexibleResult.date && isValid(flexibleResult.date)) {
              parsedDateObj = flexibleResult.date;
              // Optionally, log a warning that a fallback was used for this row
              console.warn(`Fila ${index + 2}: Se usó un formato de fecha alternativo (${flexibleResult.formatUsed || 'desconocido'}) para "${dateValue}" ya que el formato deducido (${deducedFormat}) falló.`);
            } else {
              // If both deduced and flexible parsing fail, throw an error for this row
              throw new Error(`Fecha en la fila ${index + 2} ("${dateValue}") no coincide con el formato deducido (${deducedFormat}) o no es válida.`);
            }
          }
          
          // Ensure temperature and humidity are present and valid
          const temperature = parseFloat(row.temperature_c || row["temperatura (°c)"] || row.temperature);
          if (isNaN(temperature)) throw new Error(`Temperatura inválida o faltante en la fila ${index + 2}.`);

          const humidity = parseFloat(row.humidity_pc || row["humedad (%)"] || row.humidity);
          if (isNaN(humidity)) throw new Error(`Humedad inválida o faltante en la fila ${index + 2}.`);
          
          // Optional fields
          const phValue = row.ph ? parseFloat(row.ph) : undefined;
          const ecValue = row.ec_ds_m || row["ce (ds/m)"] ? parseFloat(row.ec_ds_m || row["ce (ds/m)"]) : undefined;
          const ambientTemperatureValue = row.ambienttemperature_c || row["temperatura_ambiental_c"] || row.ambient_temperature ? parseFloat(row.ambienttemperature_c || row["temperatura_ambiental_c"] || row.ambient_temperature) : undefined;


          return {
            id: crypto.randomUUID(), // Generate new ID for imported logs
            date: parsedDateObj.toISOString(),
            temperature,
            humidity,
            ...(phValue !== undefined && !isNaN(phValue) && { ph: phValue }),
            ...(ecValue !== undefined && !isNaN(ecValue) && { ec: ecValue }),
            ...(ambientTemperatureValue !== undefined && !isNaN(ambientTemperatureValue) && { ambientTemperature: ambientTemperatureValue }),
            notes: row.notes || row.notas || "",
          };
        }).filter(log => log !== null) as DataLog[]; // Filter out any potential nulls if logic were different
        
        onImportData(importedLogs);

      } catch (error: any) {
        console.error("Error de Importación CSV:", error);
        toast({ title: "Importación Fallida", description: error.message || "No se pudo analizar el archivo CSV. Verifica el formato y los datos.", variant: "destructive" });
      } finally {
        setFileInputKey(Date.now()); // Reset file input so the same file can be chosen again if needed
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
        <p className="text-xs text-muted-foreground mb-3">Columnas esperadas (insensible a mayúsculas/minúsculas, variaciones comunes manejadas): Date/Fecha, Temperature_C/Temperatura (°C), Humidity_pc/Humedad (%), pH, EC_dS_m/CE (dS/m), AmbientTemperature_C/Temperatura_Ambiental_C, Notes/Notas. Se intentará detectar automáticamente el formato de fecha.</p>
        <Label htmlFor="csv-import" className="cursor-pointer">
            {/* Using Button asChild to make the Label behave like a button for styling */}
            <Button asChild>
                <span><UploadCloud className="mr-2 h-4 w-4" /> Elegir Archivo CSV</span>
            </Button>
            <Input id="csv-import" type="file" accept=".csv" className="hidden" onChange={handleImport} key={fileInputKey} />
        </Label>
      </div>
    </div>
  );
}


    