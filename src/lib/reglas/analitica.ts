import { diasEntre } from './fechas';

// Analítica del panel: tiempo medio entre fallas (MTBF), tendencia de cada sala y riesgo de
// falla de cada equipo. Funciones puras: lib/datos/analitica.ts trae los datos.

// MTBF: promedio de días entre fallas consecutivas. Con menos de dos fallas no hay intervalo.
export function mtbfDias(fechas: readonly string[]): number | null {
  if (fechas.length < 2) return null;
  const ordenadas = [...fechas].sort();
  let suma = 0;
  for (let i = 1; i < ordenadas.length; i += 1) suma += diasEntre(ordenadas[i - 1]!, ordenadas[i]!);
  return suma / (ordenadas.length - 1);
}

export type Tendencia = 'empeora' | 'mejora' | 'estable';

// Compara la ventana reciente con la anterior. Cambios de menos de 2 casos o del 20 % se tratan
// como estables: con pocos casos, uno más no es una tendencia.
export function tendencia(recientes: number, anteriores: number): { tendencia: Tendencia; cambio: number | null } {
  const diferencia = recientes - anteriores;
  const cambio = anteriores ? Math.round((diferencia / anteriores) * 100) : null;
  if (Math.abs(diferencia) < 2 || (cambio !== null && Math.abs(cambio) < 20)) return { tendencia: 'estable', cambio };
  return { tendencia: diferencia > 0 ? 'empeora' : 'mejora', cambio };
}

export type DatosRiesgo = {
  fallas30d: number;
  fallas90d: number;
  pendientes: number;
  aniosUso: number | null;
  mtbf: number | null;
};

export type NivelRiesgo = 'alto' | 'medio' | 'bajo';

// Puntaje de 0 a 100 de qué tan probable es que el equipo vuelva a fallar pronto. Pesa más lo
// reciente; suman los casos sin cerrar, la edad y fallas muy seguidas (MTBF corto).
export function puntajeRiesgo(d: DatosRiesgo): number {
  let puntos = d.fallas30d * 18 + Math.max(0, d.fallas90d - d.fallas30d) * 6 + d.pendientes * 10;
  if (d.aniosUso !== null) puntos += Math.min(d.aniosUso, 8) * 3;
  if (d.mtbf !== null && d.mtbf < 15) puntos += 15;
  return Math.min(100, Math.round(puntos));
}

export function nivelRiesgo(puntaje: number): NivelRiesgo {
  if (puntaje >= 50) return 'alto';
  return puntaje >= 25 ? 'medio' : 'bajo';
}
