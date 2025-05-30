
"use client";

import type { DataLog } from "@/types";
import { format, parseISO, isValid } from "date-fns";
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Thermometer, Droplets, FlaskConical, Zap, Sun } from "lucide-react";

interface CompostChartsProps {
  logs: DataLog[];
  profileColor: string;
}

const chartTooltipFormatter = (value: any, name: string, props: any) => {
  if (name === "temperature") return [`${(value as number).toFixed(1)}°C`, "Temp. Composta"];
  if (name === "ambientTemperature") return [`${(value as number).toFixed(1)}°C`, "Temp. Ambiente"];
  if (name === "humidity") return [`${(value as number).toFixed(1)}%`, "Humedad"];
  if (name === "ph") return [(value as number).toFixed(1), "pH"];
  if (name === "ec") return [`${(value as number).toFixed(2)} dS/m`, "CE"];
  return [value, name];
};

const chartTooltipLabelFormatter = (label: string, chartData: any[]) => {
  // chartData here refers to the transformed data passed to the LineChart
  const dataPoint = chartData.find(d => d.name === label);
  // dataPoint.date is the original ISO string which was validated before map
  return dataPoint ? format(parseISO(dataPoint.date), "d MMM yyyy", { locale: es }) : label;
};

export default function CompostCharts({ logs, profileColor }: CompostChartsProps) {
  // Filter logs to ensure dates are valid before any parsing attempts
  const processedLogs = logs.filter(log => log && typeof log.date === 'string' && isValid(parseISO(log.date)));

  const chartData = processedLogs
    .map((log) => ({ // log.date is now guaranteed to be a valid ISO string for parseISO
      date: log.date, // Keep the original valid ISO string
      name: format(parseISO(log.date), "d MMM", { locale: es }),
      temperature: log.temperature,
      ambientTemperature: log.ambientTemperature,
      humidity: log.humidity,
      ph: log.ph,
      ec: log.ec,
    }))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    // parseISO in sort is also safe now because it operates on .date from processedLogs

  const hasTemperatureData = chartData.some((d) => d.temperature !== undefined && d.temperature !== null);
  const hasAmbientTemperatureData = chartData.some((d) => d.ambientTemperature !== undefined && d.ambientTemperature !== null);
  const hasHumidityData = chartData.some((d) => d.humidity !== undefined && d.humidity !== null);
  const hasPhData = chartData.some((d) => d.ph !== undefined && d.ph !== null);
  const hasEcData = chartData.some((d) => d.ec !== undefined && d.ec !== null);
  
  if (processedLogs.length < 2) { // Check based on processedLogs
    return <p className="text-muted-foreground text-center py-4">No hay suficientes datos válidos para mostrar los gráficos. Se necesitan al menos 2 registros con fechas correctas.</p>;
  }
  
  const chartConfig = {
    temperature: { label: "Temp. Composta (°C)", color: profileColor || "hsl(var(--chart-1))" },
    ambientTemperature: { label: "Temp. Ambiente (°C)", color: "hsl(var(--chart-5))" },
    humidity: { label: "Humedad (%)", color: "hsl(var(--chart-2))" },
    ph: { label: "pH", color: "hsl(var(--chart-3))" },
    ec: { label: "CE (dS/m)", color: "hsl(var(--chart-4))" },
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {hasTemperatureData && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Thermometer className="mr-2 h-5 w-5 text-primary"/>Temperaturas: Composta vs. Ambiente</CardTitle>
          <CardDescription>Evolución de la temperatura de la composta {hasAmbientTemperatureData && 'y la temperatura ambiental'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} unit="°C" domain={['auto', 'auto']} />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={chartTooltipFormatter}
                  labelFormatter={(label) => chartTooltipLabelFormatter(label, chartData)}
                />} 
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="temperature" name="Temp. Composta" stroke={chartConfig.temperature.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.temperature.color }} activeDot={{ r: 6 }} unit="°C" connectNulls/>
              {hasAmbientTemperatureData && (
                <Line type="monotone" dataKey="ambientTemperature" name="Temp. Ambiente" stroke={chartConfig.ambientTemperature.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.ambientTemperature.color }} activeDot={{ r: 6 }} unit="°C" connectNulls/>
              )}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      )}

      {hasHumidityData && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Droplets className="mr-2 h-5 w-5 text-primary"/>Humedad a Través del Tiempo</CardTitle>
          <CardDescription>Evolución de la humedad de la composta.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} unit="%" domain={[0, 100]}/>
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={chartTooltipFormatter}
                  labelFormatter={(label) => chartTooltipLabelFormatter(label, chartData)}
                />} 
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="humidity" name="Humedad" stroke={chartConfig.humidity.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.humidity.color }} activeDot={{ r: 6 }} unit="%" connectNulls/>
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      )}

      {hasPhData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FlaskConical className="mr-2 h-5 w-5 text-primary"/>pH a Través del Tiempo</CardTitle>
            <CardDescription>Evolución del pH de la composta (si se registró).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData.filter(d => d.ph !== undefined)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 14]} />
                 <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={chartTooltipFormatter}
                      labelFormatter={(label) => chartTooltipLabelFormatter(label, chartData.filter(d => d.ph !== undefined))}
                    />} 
                  />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="ph" name="pH" stroke={chartConfig.ph.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.ph.color }} activeDot={{ r: 6 }} connectNulls />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {hasEcData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5 text-primary"/>CE a Través del Tiempo</CardTitle>
            <CardDescription>Evolución de la Conductividad Eléctrica de la composta (si se registró).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData.filter(d => d.ec !== undefined)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} unit="dS/m" domain={['auto', 'auto']} />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={chartTooltipFormatter}
                    labelFormatter={(label) => chartTooltipLabelFormatter(label, chartData.filter(d => d.ec !== undefined))}
                  />} 
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="ec" name="CE" stroke={chartConfig.ec.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.ec.color }} activeDot={{ r: 6 }} connectNulls unit="dS/m" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
