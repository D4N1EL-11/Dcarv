import { FRACCION_POR_VENCER, META_HORAS_PRIORIDAD } from '@/lib/config/soporte';
import type { PrioridadIncidencia } from './clasificacion';

// Tiempos de atención (SLA): cada prioridad tiene una meta en horas entre el reporte y el cierre.
// Un caso abierto está a tiempo, por vencer (consumió FRACCION_POR_VENCER de la meta) o vencido;
// uno cerrado cumplió o incumplió la meta.

export type EstadoSla = 'a_tiempo' | 'por_vencer' | 'vencido' | 'cumplido' | 'incumplido';

export const ETIQUETA_SLA: Record<EstadoSla, string> = {
  a_tiempo: 'A tiempo',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  cumplido: 'Dentro de la meta',
  incumplido: 'Fuera de la meta',
};

export type CasoSla = {
  prioridad: PrioridadIncidencia;
  creadaEn: string; // ISO 8601
  cerradaEn: string | null; // ISO 8601; null si sigue abierta
};

export type ResultadoSla = {
  estado: EstadoSla;
  metaHoras: number;
  horas: number; // transcurridas hasta el cierre o hasta ahora
  restanteHoras: number; // negativo si ya pasó la meta
};

const MS_HORA = 3_600_000;

export function metaHoras(prioridad: PrioridadIncidencia): number {
  return META_HORAS_PRIORIDAD[prioridad];
}

export function evaluarSla(caso: CasoSla, ahora: Date): ResultadoSla {
  const meta = metaHoras(caso.prioridad);
  const fin = caso.cerradaEn ? Date.parse(caso.cerradaEn) : ahora.getTime();
  const horas = Math.max(0, (fin - Date.parse(caso.creadaEn)) / MS_HORA);
  const restanteHoras = meta - horas;
  let estado: EstadoSla;
  if (caso.cerradaEn) estado = horas <= meta ? 'cumplido' : 'incumplido';
  else if (horas > meta) estado = 'vencido';
  else if (horas >= meta * FRACCION_POR_VENCER) estado = 'por_vencer';
  else estado = 'a_tiempo';
  return { estado, metaHoras: meta, horas, restanteHoras };
}

// "45 min", "5 h", "2 d 3 h". Para mostrar duraciones cortas sin decimales.
export function textoHoras(horas: number): string {
  const total = Math.max(0, Math.round(Math.abs(horas) * 60));
  if (total < 60) return `${total} min`;
  const horasEnteras = Math.floor(total / 60);
  if (horasEnteras < 24) return `${horasEnteras} h`;
  const dias = Math.floor(horasEnteras / 24);
  const resto = horasEnteras % 24;
  return resto ? `${dias} d ${resto} h` : `${dias} d`;
}

// Frase corta para la insignia: "Vence en 5 h", "Vencido hace 2 d", "Cerrado en 3 h".
export function textoSla(resultado: ResultadoSla): string {
  switch (resultado.estado) {
    case 'a_tiempo':
    case 'por_vencer':
      return `Vence en ${textoHoras(resultado.restanteHoras)}`;
    case 'vencido':
      return `Vencido hace ${textoHoras(resultado.restanteHoras)}`;
    default:
      return `Cerrado en ${textoHoras(resultado.horas)}`;
  }
}
