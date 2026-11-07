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

// Cuánto tardó en cerrarse una incidencia: del día del reporte al día del cierre (ambos en Bogotá).
export function textoResolucion(diasHastaCierre: number): string {
  if (diasHastaCierre <= 0) return 'resuelta el mismo día';
  return `resuelta en ${plural(diasHastaCierre, 'día', 'días')}`;
}

// Promedio de días de cierre con un decimal y coma decimal (es-CO); null si no hubo cierres.
export function textoPromedioDias(promedio: number | null): string {
  if (promedio === null) return 'Sin cierres';
  const redondeado = Math.round(promedio * 10) / 10;
  if (redondeado === 0) return 'Mismo día';
  const texto = redondeado.toLocaleString('es-CO', { maximumFractionDigits: 1 });
  return `${texto} ${redondeado === 1 ? 'día' : 'días'}`;
}

const formatoHora = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
});

// Hora de Colombia de un instante (vencimiento de la sesión): '3:45 p. m.'.
export function formatearHora(instante: Date): string {
  return formatoHora.format(instante).replace(/\s/g, ' ');
}

// Texto de un evento del registro de cambios, sin el actor: "reportó INC-0080 en PC-01: “No enciende”".
type EventoParaTexto = { accion: string; equipoCodigo: string | null; numeroCaso: string | null; detalle: string };

export function textoEvento(evento: EventoParaTexto): string {
  const { accion, equipoCodigo: equipo, numeroCaso: caso, detalle } = evento;
  const en = equipo ? ` en ${equipo}` : '';
  switch (accion) {
    case 'incidencia_reportada':
      return `reportó ${caso ?? 'una incidencia'}${en}${detalle ? `: “${detalle}”` : ''}`;
    case 'incidencia_asignada':
      return `asignó ${caso ?? 'una incidencia'} ${detalle}`.trim();
    case 'incidencia_reasignada':
      return `reasignó ${caso ?? 'una incidencia'} ${detalle}`.trim();
    case 'incidencia_cerrada':
      return `cerró ${caso ?? 'una incidencia'}${en}`;
    case 'foto_agregada':
      return `agregó una foto a ${caso ?? 'una incidencia'}${en}`;
    case 'estado_equipo':
      return `cambió el estado de ${equipo ?? 'un equipo'}: ${detalle}`;
    case 'equipo_registrado':
      return `registró el equipo ${equipo ?? ''} ${detalle}`.replace(/\s+/g, ' ').trim();
    case 'equipo_trasladado':
      return `trasladó ${equipo ?? 'un equipo'} ${detalle}`.trim();
    case 'sala_registrada':
      return `registró la sala ${detalle}`;
    case 'sala_renombrada':
      return `renombró la sala ${detalle}`;
    case 'sala_eliminada':
      return `eliminó la sala ${detalle}`;
    case 'tecnico_registrado':
      return `registró al técnico ${detalle}`;
    case 'tecnico_renombrado':
      return `renombró al técnico ${detalle}`;
    case 'tecnico_activado':
      return `activó al técnico ${detalle}`;
    case 'tecnico_desactivado':
      return `desactivó al técnico ${detalle}`;
    case 'rol_cambiado':
      return `cambió el rol de ${detalle}`;
    case 'incidencia_clasificada':
      return `clasificó ${caso ?? 'una incidencia'}${en}: ${detalle}`;
    case 'solicitud_soporte':
      return `pidió el acceso de soporte para ${detalle}`;
    case 'solicitud_aprobada':
      return `aprobó el acceso de soporte de ${detalle}`;
    case 'solicitud_rechazada':
      return `rechazó el acceso de soporte de ${detalle}`;
    case 'mantenimiento_programado':
      return `programó el mantenimiento de ${detalle}`;
    case 'mantenimiento_realizado':
      return `registró el mantenimiento de ${detalle}`;
    case 'equipo_movido':
      return `movió ${equipo ?? 'un equipo'} en el mapa ${detalle}`.trim();
    case 'repuesto_registrado':
      return `registró el repuesto ${detalle}`;
    case 'repuesto_entrada':
      return `registró una entrada de ${detalle}`;
    case 'hoja_de_vida':
      return `actualizó la hoja de vida de ${equipo ?? 'un equipo'}`;
    case 'caso_calificado':
      return `calificó la atención de ${caso ?? 'un caso'}: ${detalle}`;
    case 'articulo_publicado':
      return `publicó la guía "${detalle}"`;
    case 'articulo_editado':
      return `editó la guía "${detalle}"`;
    case 'articulo_eliminado':
      return `eliminó la guía "${detalle}"`;
    case 'repuesto_usado':
      return `usó ${detalle} en ${caso ?? 'una incidencia'}${en}`;
    default:
      return detalle || accion;
  }
}
