import { ErrorDeNegocio } from './errores';

// RN-12: el nombre de la sala no puede estar vacío (y la columna admite hasta 80 caracteres).
export function validarNombreSala(nombre: string): void {
  const limpio = nombre.trim();
  if (!limpio || limpio.length > 80) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El nombre de la sala debe tener entre 1 y 80 caracteres.');
  }
}
