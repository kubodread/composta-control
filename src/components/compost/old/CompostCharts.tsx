
"use client";

import type { DataLog } from "@/types";
import { format, parseISO } from "date-fns";
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Thermometer, Droplets, FlaskConical, Zap } from "lucide-react";

interface CompostChartsProps {
  logs: DataLog[];
  profileColor: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 border bg-background/80 backdrop-blur-sm shadow-lg rounded-md">
        <p className="label font-medium">{`${format(parseISO(label), "d MMM yyyy", { locale: es })}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(1)} ${entry.unit || ""}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CompostCharts({ logs, profileColor }: CompostChartsProps) {
  const chartData = logs
    .map((log) => ({
      date: log.date,
      name: format(parseISO(log.date), "d MMM", { locale: es }),
      temperature: log.temperature,
      humidity: log.humidity,
      ph: log.ph,
      ec: log.ec,
    }))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const hasPhData = chartData.some((d) => d.ph !== undefined && d.ph !== null);
  const hasEcData = chartData.some((d) => d.ec !== undefined && d.ec !== null);

  if (logs.length < 2) {
    return <p className="text-muted-foreground text-center py-4">No hay suficientes datos para mostrar los gráficos. Se necesitan al menos 2 registros.</p>;
  }
  
  const chartConfig = {
    temperature: { label: "Temperatura (°C)", color: profileColor || "hsl(var(--chart-1))" },
    humidity: { label: "Humedad (%)", color: "hsl(var(--chart-2))" },
    ph: { label: "pH", color: "hsl(var(--chart-3))" },
    ec: { label: "CE (dS/m)", color: "hsl(var(--chart-4))" },
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Thermometer className="mr-2 h-5 w-5 text-primary"/>Temperatura a Través del Tiempo</CardTitle>
          <CardDescription>Evolución de la temperatura de la composta.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} unit="°C" domain={['auto', 'auto']} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => {
                const item = props.payload as any;
                if (name === "temperature") return [`${(value as number).toFixed(1)}°C`, "Temperatura"];
                if (name === "humidity") return [`${(value as number).toFixed(1)}%`, "Humedad"];
                if (name === "ph") return [(value as number).toFixed(1), "pH"];
                if (name === "ec") return [`${(value as number).toFixed(2)} dS/m`, "CE"];
                return [value, name];
              }}
              labelFormatter={(label) => format(parseISO(chartData.find(d => d.name ===label)?.date || new Date()), "d MMM yyyy", { locale: es })} 
              />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="temperature" name="Temperatura" stroke={chartConfig.temperature.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.temperature.color }} activeDot={{ r: 6 }} unit="°C" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

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
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => {
                const item = props.payload as any;
                if (name === "temperature") return [`${(value as number).toFixed(1)}°C`, "Temperatura"];
                if (name === "humidity") return [`${(value as number).toFixed(1)}%`, "Humedad"];
                if (name === "ph") return [(value as number).toFixed(1), "pH"];
                if (name === "ec") return [`${(value as number).toFixed(2)} dS/m`, "CE"];
                return [value, name];
              }} 
              labelFormatter={(label) => format(parseISO(chartData.find(d => d.name ===label)?.date || new Date()), "d MMM yyyy", { locale: es })}
              />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="humidity" name="Humedad" stroke={chartConfig.humidity.color} strokeWidth={2} dot={{ r: 3, fill: chartConfig.humidity.color }} activeDot={{ r: 6 }} unit="%"/>
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

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
                 <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => {
                    const item = props.payload as any;
                    if (name === "temperature") return [`${(value as number).toFixed(1)}°C`, "Temperatura"];
                    if (name === "humidity") return [`${(value as number).toFixed(1)}%`, "Humedad"];
                    if (name === "ph") return [(value as number).toFixed(1), "pH"];
                    if (name === "ec") return [`${(value as number).toFixed(2)} dS/m`, "CE"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => format(parseISO(chartData.find(d => d.name ===label)?.date || new Date()), "d MMM yyyy", { locale: es })} 
                  />} />
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
                <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => {
                    const item = props.payload as any;
                    if (name === "temperature") return [`${(value as number).toFixed(1)}°C`, "Temperatura"];
                    if (name === "humidity") return [`${(value as number).toFixed(1)}%`, "Humedad"];
                    if (name === "ph") return [(value as number).toFixed(1), "pH"];
                    if (name === "ec") return [`${(value as number).toFixed(2)} dS/m`, "CE"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => format(parseISO(chartData.find(d => d.name ===label)?.date || new Date()), "d MMM yyyy", { locale: es })}
                  />} />
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
