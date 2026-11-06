import { CATEGORIAS_INCIDENCIA, PRIORIDADES_INCIDENCIA } from '@/lib/config/soporte';

// Categoría (qué tipo de falla es) y prioridad (qué tan urgente es) de una incidencia.

export type CategoriaIncidencia = (typeof CATEGORIAS_INCIDENCIA)[number];
export type PrioridadIncidencia = (typeof PRIORIDADES_INCIDENCIA)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaIncidencia, string> = {
  hardware: 'Hardware',
  software: 'Software',
  red: 'Red e internet',
  perifericos: 'Periféricos',
  otro: 'Otro',
};

// Ayuda para quien reporta: con ejemplos concretos elige mejor la categoría.
export const AYUDA_CATEGORIA: Record<CategoriaIncidencia, string> = {
  hardware: 'No enciende, se apaga solo, pantalla, ruidos, calentamiento.',
  software: 'Programas que no abren, Windows, licencias, virus, lentitud.',
  red: 'Sin internet, no conecta al wifi o a la red de la sala.',
  perifericos: 'Teclado, mouse, audífonos, cámara, cables, USB.',
  otro: 'Cualquier otra cosa.',
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const AYUDA_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  alta: 'Impide usar el equipo o afecta una clase en curso.',
  media: 'Se puede trabajar, pero con dificultad.',
  baja: 'Detalle menor que puede esperar.',
};

export function esCategoria(valor: unknown): valor is CategoriaIncidencia {
  return (CATEGORIAS_INCIDENCIA as readonly unknown[]).includes(valor);
}

export function esPrioridad(valor: unknown): valor is PrioridadIncidencia {
  return (PRIORIDADES_INCIDENCIA as readonly unknown[]).includes(valor);
}

// Orden de atención: alta primero. Coincide con el ORDER BY de "Requiere atención".
export function pesoPrioridad(prioridad: PrioridadIncidencia): number {
  return { alta: 0, media: 1, baja: 2 }[prioridad];
}

// Lista de trabajo: primero la prioridad y, dentro de cada prioridad, lo que más espera.
export function compararAtencion(
  a: { prioridad: PrioridadIncidencia; fecha: string },
  b: { prioridad: PrioridadIncidencia; fecha: string },
): number {
  return pesoPrioridad(a.prioridad) - pesoPrioridad(b.prioridad) || a.fecha.localeCompare(b.fecha);
}

// La categoría con más casos (para "lo que más falla" en una sala). Empate: el orden de la lista.
export function categoriaMasFrecuente(
  conteo: Partial<Record<CategoriaIncidencia, number>>,
): { categoria: CategoriaIncidencia; total: number } | null {
  let mejor: { categoria: CategoriaIncidencia; total: number } | null = null;
  for (const categoria of CATEGORIAS_INCIDENCIA) {
    const total = conteo[categoria] ?? 0;
    if (total > 0 && (!mejor || total > mejor.total)) mejor = { categoria, total };
  }
  return mejor;
}
