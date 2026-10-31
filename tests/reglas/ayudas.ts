import { expect } from 'vitest';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';

export function esperarCodigo(fn: () => unknown, codigo: CodigoError): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorDeNegocio);
    expect((error as ErrorDeNegocio).codigo).toBe(codigo);
    return;
  }
  expect.unreachable(`Se esperaba el error ${codigo}`);
}
