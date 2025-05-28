
import type { CNMaterial } from '@/types';

export const cnRatioMaterials: CNMaterial[] = [
  // Carbon-Rich (Browns)
  { name: 'Hojas Caídas (Secas)', ratio: '40-80:1', type: 'carbon' },
  { name: 'Paja o Heno', ratio: '40-100:1', type: 'carbon' },
  { name: 'Astillas de Madera o Serrín (Añejo)', ratio: '100-500:1', type: 'carbon' },
  { name: 'Cartón (Triturado, sin impresión brillante)', ratio: '350-500:1', type: 'carbon' },
  { name: 'Periódico (Triturado)', ratio: '175:1', type: 'carbon' },
  { name: 'Agujas de Pino', ratio: '60-110:1', type: 'carbon' },
  { name: 'Tallos de Maíz', ratio: '60-75:1', type: 'carbon' },

  // Nitrogen-Rich (Greens)
  { name: 'Recortes de Césped (Fresco)', ratio: '15-25:1', type: 'nitrogen' },
  { name: 'Restos de Frutas y Verduras', ratio: '12-20:1', type: 'nitrogen' },
  { name: 'Posos de Café y Filtros', ratio: '20:1', type: 'nitrogen' },
  { name: 'Bolsitas/Hojas de Té', ratio: '30:1', type: 'nitrogen' },
  { name: 'Algas Marinas/Kelp', ratio: '5-20:1', type: 'nitrogen' },
  { name: 'Estiércol (Herbívoro, ej: vaca, caballo)', ratio: '15-25:1', type: 'nitrogen' },
  { name: 'Estiércol (Aves de corral)', ratio: '10-15:1', type: 'nitrogen' },
  { name: 'Restos de Poda (Verdes)', ratio: '25-30:1', type: 'nitrogen' },
  { name: 'Harina de Alfalfa', ratio: '12-15:1', type: 'nitrogen' },
];
