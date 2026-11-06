import { LARGO_MAXIMO_COMENTARIO, LARGO_MINIMO_COMENTARIO } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';
import type { EstadoIncidencia } from './incidencia';

// Comentarios de una incidencia: conversación entre soporte y quien reportó la falla.

export type TipoComentario = 'comentario' | 'cierre';

export function validarComentario(texto: string): string {
  const limpio = texto.trim();
  if (limpio.length < LARGO_MINIMO_COMENTARIO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `El comentario debe tener al menos ${LARGO_MINIMO_COMENTARIO} caracteres.`);
  }
  if (limpio.length > LARGO_MAXIMO_COMENTARIO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `El comentario no puede pasar de ${LARGO_MAXIMO_COMENTARIO} caracteres.`);
  }
  return limpio;
}

export type QuienComenta = { soporte: boolean; esQuienReporto: boolean };

// Leer: soporte, o quien reportó el caso. Nadie más ve la conversación de un caso ajeno.
export function puedeLeerComentarios(quien: QuienComenta): boolean {
  return quien.soporte || quien.esQuienReporto;
}

// Escribir: las mismas personas, y solo mientras el caso no esté cerrado. Al cerrar, soporte deja
// la nota de solución (tipo 'cierre'); si la falla vuelve, se reporta un caso nuevo (como al cerrar).
export function puedeComentar(quien: QuienComenta, estado: EstadoIncidencia): boolean {
  return puedeLeerComentarios(quien) && estado !== 'cerrada';
}

// Por qué no se puede comentar, para mostrarlo en lugar del formulario.
export function motivoSinComentarios(quien: QuienComenta, estado: EstadoIncidencia): string | null {
  if (!puedeLeerComentarios(quien)) return 'Solo soporte y quien reportó la falla pueden ver esta conversación.';
  if (estado === 'cerrada') return 'El caso está cerrado. Si la falla vuelve, reporte una nueva incidencia.';
  return null;
}
