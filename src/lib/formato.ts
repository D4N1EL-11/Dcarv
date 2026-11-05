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

const formatoFechaLarga = new Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeZone: 'UTC' });

// '2026-11-05' → 'jueves, 5 de noviembre de 2026' (encabezado del panel).
export function formatearFechaLarga(fecha: string): string {
  return formatoFechaLarga.format(new Date(`${fecha}T00:00:00Z`));
}

const formatoDiaCorto = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// '2026-11-04' → '4 nov' (marcas del eje del gráfico). es-CO escribe "4 de nov.": se arma con
// las partes para quitar el "de" y el punto.
export function formatearDiaCorto(fecha: string): string {
  const partes = formatoDiaCorto.formatToParts(new Date(`${fecha}T00:00:00Z`));
  const dia = partes.find((p) => p.type === 'day')?.value ?? '';
  const mes = (partes.find((p) => p.type === 'month')?.value ?? '').replace('.', '');
  return `${dia} ${mes}`.trim();
}

// "hace 5 min", "hace 3 h", "ayer", "hace 4 días"; más de 30 días, la fecha.
export function tiempoRelativo(momentoIso: string, ahora: Date = new Date()): string {
  const segundos = Math.max(0, Math.round((ahora.getTime() - Date.parse(momentoIso)) / 1000));
  if (segundos < 60) return 'hace un momento';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias <= 30) return `hace ${dias} días`;
  return formatearFecha(momentoIso.slice(0, 10));
}

export function plural(cantidad: number, singular: string, varios: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}
