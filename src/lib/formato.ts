import { ETIQUETA_EQUIPO, type EstadoEquipo } from '@/lib/reglas/equipo';
import { ETIQUETA_INCIDENCIA, type EstadoIncidencia } from '@/lib/reglas/incidencia';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });

export function formatearFecha(fecha: string): string {
  return formatoFecha.format(new Date(`${fecha}T00:00:00Z`));
}

export function etiquetaEstadoEquipo(estado: EstadoEquipo): string {
  return ETIQUETA_EQUIPO[estado];
}

export function etiquetaEstadoIncidencia(estado: EstadoIncidencia): string {
  return ETIQUETA_INCIDENCIA[estado];
}

// Días transcurridos (calculados con diasEntre y hoyBogota) como texto para la interfaz.
export function textoAntiguedad(dias: number): string {
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

// Parte entera del porcentaje; 0 si no hay total (sala sin equipos).
export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

export function plural(cantidad: number, singular: string, varios: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}
