import { diasEntre, sumarDias } from './fechas';

export type PuntoActividad = { dia: string; reportadas: number; cerradas: number };
export type ConteoDiario = { dia: string; tipo: 'reportadas' | 'cerradas'; total: number };

// Serie continua, día por día, entre `desde` y `hasta` (ambos incluidos). La base solo devuelve
// los días con movimiento; los demás valen 0 para que el eje del gráfico no salte fechas.
export function completarSerie(desde: string, hasta: string, conteos: ConteoDiario[]): PuntoActividad[] {
  const largo = Math.max(0, diasEntre(desde, hasta) + 1);
  const serie: PuntoActividad[] = Array.from({ length: largo }, (_, i) => ({
    dia: sumarDias(desde, i),
    reportadas: 0,
    cerradas: 0,
  }));
  const posicion = new Map(serie.map((punto, i) => [punto.dia, i]));
  for (const { dia, tipo, total } of conteos) {
    const i = posicion.get(dia);
    if (i !== undefined) serie[i]![tipo] += total;
  }
  return serie;
}

// Porcentajes enteros que suman exactamente 100 (método del mayor residuo). Redondear cada parte
// por separado puede dar 99 % o 101 % en la barra de estados.
export function repartirPorcentajes(valores: number[]): number[] {
  const total = valores.reduce((suma, valor) => suma + valor, 0);
  if (total <= 0) return valores.map(() => 0);
  const exactos = valores.map((valor) => (valor / total) * 100);
  const enteros = exactos.map(Math.floor);
  let faltan = 100 - enteros.reduce((suma, valor) => suma + valor, 0);
  const orden = exactos
    .map((exacto, i) => ({ i, residuo: exacto - Math.floor(exacto) }))
    .sort((a, b) => b.residuo - a.residuo || a.i - b.i);
  for (const { i } of orden) {
    if (faltan <= 0) break;
    enteros[i]! += 1;
    faltan -= 1;
  }
  return enteros;
}
