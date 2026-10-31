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
