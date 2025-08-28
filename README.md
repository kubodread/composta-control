# Composta-Control Controlador de Composta por Kubiotec

**Controlador de Composta** es una aplicación web progresiva (PWA) diseñada para ayudarte a gestionar, monitorear y optimizar tus pilas de compostaje de manera eficiente. La aplicación funciona sin conexión a internet una vez que se ha cargado por primera vez, permitiéndote registrar datos en cualquier lugar.

visita en https://composta-control.vercel.app/
---

## Características Principales

### 1. Gestión Integral de Perfiles de Compostaje
- **Múltiples Perfiles:** Crea y gestiona perfiles para cada una de tus pilas de composta de forma independiente.
- **Personalización:** Asigna un nombre y un color distintivo a cada perfil para una fácil identificación visual en los gráficos.
- **Persistencia Local:** Todos tus datos se almacenan de forma segura en el `localStorage` de tu navegador, lo que garantiza privacidad y funcionalidad offline.

### 2. Balance de Relación Carbono:Nitrógeno (C:N)
Una relación C:N adecuada es crucial para un compostaje eficiente. La aplicación te ayuda a:
- **Calcular la Relación C:N:** Añade materiales ricos en carbono (marrones) y nitrógeno (verdes) de una lista predefinida.
- **Especificar Cantidades:** Define la cantidad (en "partes" relativas) de cada material que has añadido a tu pila.
- **Obtener una Estimación:** La aplicación calcula una relación C:N estimada para tu mezcla, ayudándote a ajustarla para alcanzar el rango ideal (típicamente entre 25:1 y 30:1).
- **Guardar y Anotar:** Guarda la composición de tu mezcla y añade notas o recomendaciones para futuros ajustes.

### 3. Monitoreo y Registro de Datos Detallado
Registra parámetros clave de tu pila de composta para un seguimiento preciso:
- **Temperatura de la Composta (°C)**
- **Humedad (%)**
- **pH** (Opcional)
- **Conductividad Eléctrica (CE) en dS/m** (Opcional)
- **Temperatura Ambiental (°C)** (Opcional)
- **Notas y Observaciones**

### 4. Visualización con Gráficos Interactivos
Analiza el progreso de tu compostaje a lo largo del tiempo con gráficos fáciles de entender:
- **Gráfico de Temperaturas:** Compara la temperatura interna de la composta con la temperatura ambiental.
- **Gráfico de Humedad:** Monitorea la evolución de la humedad.
- **Gráficos de pH y CE:** Visualiza las tendencias de estos parámetros si decides registrarlos.

### 5. Galería de Seguimiento Visual
- **Sube Fotos:** Documenta el progreso de tu composta con imágenes. Añade leyendas para describir cada foto (ej: "Semana 3, después de voltear").

---

## Importar y Exportar Datos (CSV)

Puedes fácilmente respaldar tus datos o importarlos desde otras fuentes usando archivos CSV.

### Exportar Datos
La aplicación te permite descargar todos los registros de un perfil en un archivo CSV con un solo clic.

### Importar Datos
Para importar datos a un perfil, tu archivo CSV debe tener una estructura específica.

#### Columnas Requeridas
Las siguientes columnas son **obligatorias**:
- `Date` o `Fecha`
- `Temperature_C` o `Temperatura (°C)`
- `Humidity_pc` o `Humedad (%)`

#### Columnas Opcionales
Puedes incluir estas columnas si tienes los datos:
- `pH`
- `EC_dS_m` o `CE (dS/m)`
- `AmbientTemperature_C` o `Temperatura_Ambiental_C`
- `Notes` o `Notas`

**Nota:** La aplicación es flexible con los nombres de las columnas y reconoce las variaciones comunes mencionadas anteriormente (insensible a mayúsculas/minúsculas).

#### Formato de Fecha
El importador es inteligente y puede detectar automáticamente una variedad de formatos de fecha. Para asegurar la máxima compatibilidad, se recomienda usar el formato **ISO 8601**. Sin embargo, también se suelen reconocer los siguientes formatos:
- `YYYY-MM-DD HH:mm:ss` (ej: `2023-10-27 14:30:00`)
- `YYYY-MM-DD` (ej: `2023-10-27`)
- `DD/MM/YYYY` (ej: `27/10/2023`)
- `MM/DD/YYYY` (ej: `10/27/2023`)

El importador analizará las primeras filas para deducir el formato correcto y lo aplicará al resto del archivo.

#### Ejemplo de Archivo CSV Válido:
```csv
Date,Temperature_C,Humidity_pc,pH,EC_dS_m,Notes
2023-10-27 15:00:00,55.5,62.1,6.8,2.1,"Se realizó el primer volteo"
2023-10-28 16:00:00,58.2,60.5,,,
2023-10-29 14:30:00,60.1,59.8,6.7,2.3,"Se añadió un poco de agua"
```

---

## Pila Tecnológica
- **Framework:** Next.js (con App Router)
- **Lenguaje:** TypeScript
- **UI:** React, ShadCN UI, Tailwind CSS
- **Gráficos:** Recharts
- **Funcionalidad Offline:** Progressive Web App (PWA) con Service Workers.
- **Almacenamiento:** LocalStorage del navegador.


### **Autor**

* **José Félix Kubota Hernández** con ayuda de gemini de google - [Kubodread](https://github.com/kubodread)

