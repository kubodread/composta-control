

export interface CompostImage {
  id: string;
  url: string;
  caption?: string;
  dateUploaded: string;
}

export interface DataLog {
  id: string;
  date: string; // ISO string
  temperature: number; // Celsius
  humidity: number; // Percentage
  ph?: number;
  ec?: number; // dS/m
  notes?: string;
}

export interface CNMaterialInput {
  name: string; // Name of the material from cnRatioMaterials
  quantity: number; // User-defined quantity (e.g., "parts")
}

export interface CompostProfile {
  id: string;
  name: string;
  color: string; // Hex color for charts
  initialComposition: string;
  cnMaterialsUsed?: CNMaterialInput[]; // List of materials and their quantities
  calculatedCNRatio?: string; // e.g., "28.5:1", result of calculation
  cnRatioNotes?: string;
  dataLogs: DataLog[];
  images: CompostImage[];
  createdAt: string; // ISO string
}

export interface CNMaterial {
  name: string;
  ratio: string; // e.g., "20-30:1"
  type: 'carbon' | 'nitrogen';
}

