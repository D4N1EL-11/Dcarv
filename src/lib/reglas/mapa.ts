import { MAXIMO_COLUMNAS_MAPA, MAXIMO_FILAS_MAPA, MINIMO_COLUMNAS_MAPA } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';

// Mapa de una sala: una cuadrícula de N columnas donde cada equipo ocupa un puesto (fila, columna).
// Un equipo sin puesto guardado, con un puesto que quedó fuera al angostar el mapa o con un puesto
// repetido se dibuja en el primer puesto libre, leyendo de izquierda a derecha y de arriba abajo.

export type Puesto = { fila: number; columna: number };
type ConPuesto = { fila: number | null; columna: number | null };

export type Ubicado<T> = T & Puesto & { automatico: boolean };

export function validarColumnasMapa(columnas: number): number {
  if (!Number.isInteger(columnas) || columnas < MINIMO_COLUMNAS_MAPA || columnas > MAXIMO_COLUMNAS_MAPA) {
    throw new ErrorDeNegocio(
      'DATOS_INVALIDOS',
      `El mapa debe tener entre ${MINIMO_COLUMNAS_MAPA} y ${MAXIMO_COLUMNAS_MAPA} columnas.`,
    );
  }
  return columnas;
}

export function validarPuesto(puesto: Puesto, columnas: number): Puesto {
  const { fila, columna } = puesto;
  if (
    !Number.isInteger(fila) ||
    !Number.isInteger(columna) ||
    fila < 1 ||
    fila > MAXIMO_FILAS_MAPA ||
    columna < 1 ||
    columna > columnas
  ) {
    throw new ErrorDeNegocio('PUESTO_INVALIDO');
  }
  return puesto;
}

const clave = (fila: number, columna: number) => `${fila}:${columna}`;

// Devuelve los equipos con su puesto final y cuántas filas ocupa el mapa (al menos una).
export function distribuirEquipos<T extends ConPuesto>(
  equipos: readonly T[],
  columnas: number,
): { filas: number; equipos: Ubicado<T>[] } {
  const ocupados = new Set<string>();
  const resultado: (Ubicado<T> | null)[] = equipos.map(() => null);
  const pendientes: number[] = [];

  equipos.forEach((equipo, indice) => {
    const { fila, columna } = equipo;
    const valido =
      fila !== null &&
      columna !== null &&
      fila >= 1 &&
      fila <= MAXIMO_FILAS_MAPA &&
      columna >= 1 &&
      columna <= columnas &&
      !ocupados.has(clave(fila, columna));
    if (valido) {
      ocupados.add(clave(fila, columna));
      resultado[indice] = { ...equipo, fila, columna, automatico: false };
    } else {
      pendientes.push(indice);
    }
  });

  let cursor = 0;
  for (const indice of pendientes) {
    while (ocupados.has(clave(Math.floor(cursor / columnas) + 1, (cursor % columnas) + 1))) cursor += 1;
    const fila = Math.floor(cursor / columnas) + 1;
    const columna = (cursor % columnas) + 1;
    ocupados.add(clave(fila, columna));
    resultado[indice] = { ...equipos[indice]!, fila, columna, automatico: true };
  }

  const ubicados = resultado as Ubicado<T>[];
  const filas = Math.max(1, ...ubicados.map((e) => e.fila));
  return { filas, equipos: ubicados };
}
