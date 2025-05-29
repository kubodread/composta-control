
"use client";

import type { DataLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Thermometer, Droplets, FlaskConical, Zap, FileText } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const dataLogSchema = z.object({
  date: z.date({ required_error: "La fecha es obligatoria." }),
  temperature: z.coerce.number().min(-50, "Demasiado bajo").max(100, "Demasiado alto"),
  humidity: z.coerce.number().min(0, "Mín 0%").max(100, "Máx 100%"),
  ph: z.coerce.number().min(0).max(14).optional().or(z.literal("")),
  ec: z.coerce.number().min(0).optional().or(z.literal("")),
  notes: z.string().optional(),
});

type DataLogFormValues = z.infer<typeof dataLogSchema>;

interface DataLogFormProps {
  onSubmit: (data: Omit<DataLog, "id">) => void; 
  defaultValues?: Partial<DataLogFormValues & { date: string }>; 
  isEditMode?: boolean;
}

export default function DataLogForm({ onSubmit, defaultValues, isEditMode = false }: DataLogFormProps) {
  const { toast } = useToast();
  const form = useForm<DataLogFormValues>({
    resolver: zodResolver(dataLogSchema),
    defaultValues: {
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      temperature: defaultValues?.temperature ?? undefined,
      humidity: defaultValues?.humidity ?? undefined,
      ph: defaultValues?.ph ?? "",
      ec: defaultValues?.ec ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const processSubmit = (data: DataLogFormValues) => {
    const submissionData: Omit<DataLog, "id"> = { 
      date: data.date.toISOString(),
      temperature: data.temperature,
      humidity: data.humidity,
      ...(data.ph !== "" && { ph: Number(data.ph) }),
      ...(data.ec !== "" && { ec: Number(data.ec) }),
      ...(data.notes && { notes: data.notes }),
    };
    onSubmit(submissionData);
    if (!isEditMode) {
      form.reset({
        date: new Date(),
        temperature: undefined,
        humidity: undefined,
        ph: "",
        ec: "",
        notes: "",
      });
      toast({ title: "¡Datos Registrados!", description: "Nuevos datos de composta han sido registrados exitosamente." });
    } else {
       toast({ title: "¡Datos Actualizados!", description: "Los datos de composta han sido actualizados exitosamente." });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6 p-4 border rounded-lg shadow-sm bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          control={form.control}
          name="date"
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4 text-primary" />Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="temperature" className="flex items-center"><Thermometer className="mr-2 h-4 w-4 text-primary" />Temperatura (°C)</Label>
          <Input id="temperature" type="number" step="0.1" {...form.register("temperature")} placeholder="ej: 55.5" />
          {form.formState.errors.temperature && <p className="text-sm text-destructive">{form.formState.errors.temperature.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="humidity" className="flex items-center"><Droplets className="mr-2 h-4 w-4 text-primary" />Humedad (%)</Label>
          <Input id="humidity" type="number" step="0.1" {...form.register("humidity")} placeholder="ej: 60.2" />
          {form.formState.errors.humidity && <p className="text-sm text-destructive">{form.formState.errors.humidity.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ph" className="flex items-center"><FlaskConical className="mr-2 h-4 w-4 text-primary" />pH (Opcional)</Label>
          <Input id="ph" type="number" step="0.1" {...form.register("ph")} placeholder="ej: 6.8" />
          {form.formState.errors.ph && <p className="text-sm text-destructive">{form.formState.errors.ph.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ec" className="flex items-center"><Zap className="mr-2 h-4 w-4 text-primary" />CE (dS/m, Opcional)</Label>
          <Input id="ec" type="number" step="0.01" {...form.register("ec")} placeholder="ej: 2.5" />
          {form.formState.errors.ec && <p className="text-sm text-destructive">{form.formState.errors.ec.message}</p>}
        </div>
      </div>
        
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Notas (Opcional)</Label>
        <Textarea id="notes" {...form.register("notes")} placeholder="Cualquier observación, acciones tomadas, etc." />
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (isEditMode ? "Guardando..." : "Registrando..." ): (isEditMode ? "Guardar Cambios" : "Registrar Datos")}
      </Button>
    </form>
  );
}
