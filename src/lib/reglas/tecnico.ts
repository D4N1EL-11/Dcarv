import { DIAS_REASIGNACION } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';

export function validarNombreTecnico(nombre: string): void {
  const limpio = nombre.trim();
  if (limpio.length < 2 || limpio.length > 100) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El nombre debe tener entre 2 y 100 caracteres.');
  }
}

// RN-10: técnico con menos casos en revisión, distinto de `excluir`. En empate gana el primero
// del orden recibido (los técnicos se consultan por nombre). null si no hay otro disponible.
export function elegirConMenosCarga(
  carga: ReadonlyMap<string, number>,
  excluir: string | null,
): string | null {
  let elegido: string | null = null;
  let menor = Number.POSITIVE_INFINITY;
  for (const [id, casos] of carga) {
    if (id === excluir) continue;
    if (casos < menor) {
      elegido = id;
      menor = casos;
    }
  }
  return elegido;
}

// Días que faltan para que la reasignación automática tome el caso (se reasigna cuando
// pasan más de DIAS_REASIGNACION días). 0 = entra en la próxima revisión diaria.
export function diasHastaReasignacion(diasTranscurridos: number): number {
  return Math.max(0, DIAS_REASIGNACION + 1 - diasTranscurridos);
}
