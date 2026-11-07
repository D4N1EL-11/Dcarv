import { MAXIMO_CANTIDAD_REPUESTO, MAXIMO_EXISTENCIAS_REPUESTO } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';

// Repuestos: piezas en bodega. Las existencias nunca quedan negativas; el mínimo solo avisa.

export function validarNombreRepuesto(nombre: string): string {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  if (limpio.length < 2 || limpio.length > 80) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El nombre del repuesto debe tener entre 2 y 80 caracteres.');
  }
  return limpio;
}

// Cantidad que se usa en un caso o que entra a bodega.
export function validarCantidad(cantidad: number): number {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAXIMO_CANTIDAD_REPUESTO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `La cantidad debe ser un entero entre 1 y ${MAXIMO_CANTIDAD_REPUESTO}.`);
  }
  return cantidad;
}

// Existencias iniciales y mínimo: enteros desde 0.
export function validarExistencias(valor: number, sujeto = 'Las existencias deben'): number {
  if (!Number.isInteger(valor) || valor < 0 || valor > MAXIMO_EXISTENCIAS_REPUESTO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `${sujeto} ser un entero entre 0 y ${MAXIMO_EXISTENCIAS_REPUESTO}.`);
  }
  return valor;
}

// Costo unitario en pesos (0 = sin dato), con hasta dos decimales.
export function validarCosto(costo: number): number {
  if (!Number.isFinite(costo) || costo < 0 || costo > 100_000_000) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El costo debe ser un valor entre 0 y 100.000.000.');
  }
  return Math.round(costo * 100) / 100;
}

// Bajo mínimo: hay que comprar. Un repuesto con mínimo 0 solo avisa cuando se agota.
export function bajoMinimo(repuesto: { existencias: number; minimo: number }): boolean {
  return repuesto.existencias === 0 || repuesto.existencias < repuesto.minimo;
}
