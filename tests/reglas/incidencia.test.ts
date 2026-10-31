// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatearNumeroCaso, puedeAsignarse, validarDescripcion } from '@/lib/reglas/incidencia';
import { esperarCodigo } from './ayudas';

describe('reglas de incidencia', () => {
  it('T-07 descripción vacía', () => {
    esperarCodigo(() => validarDescripcion(''), 'DATOS_INVALIDOS');
  });
  it('T-08 descripción de 2 caracteres', () => {
    esperarCodigo(() => validarDescripcion('ab'), 'DATOS_INVALIDOS');
  });
  it('T-09 descripción válida', () => {
    expect(() => validarDescripcion('No enciende')).not.toThrow();
  });
  it('T-10 número de caso 1', () => {
    expect(formatearNumeroCaso(1)).toBe('INC-0001');
  });
  it('T-11 número de caso 42', () => {
    expect(formatearNumeroCaso(42)).toBe('INC-0042');
  });
  it('T-12 número de caso 1234', () => {
    expect(formatearNumeroCaso(1234)).toBe('INC-1234');
  });
  it('T-13 una incidencia abierta se puede asignar', () => {
    expect(puedeAsignarse('abierta')).toBe(true);
  });
  it('T-14 en revisión o cerrada no se puede asignar', () => {
    expect(puedeAsignarse('en_revision')).toBe(false);
    expect(puedeAsignarse('cerrada')).toBe(false);
  });
});
