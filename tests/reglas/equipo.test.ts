// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { esEstadoEquipoValido, normalizarCodigo, validarDatosEquipo } from '@/lib/reglas/equipo';
import { esperarCodigo } from './ayudas';

describe('reglas de equipo', () => {
  it('T-01 normalizarCodigo recorta y conserva la grafía', () => {
    expect(normalizarCodigo(' pc-sala1-03 ')).toBe('pc-sala1-03');
    expect(normalizarCodigo(' PC-SALA1-03 ')).toBe('PC-SALA1-03');
  });
  it('T-02 código vacío', () => {
    esperarCodigo(() => validarDatosEquipo({ codigo: ' ', sala: 'Sala 1' }), 'DATOS_INVALIDOS');
  });
  it('T-03 sala vacía', () => {
    esperarCodigo(() => validarDatosEquipo({ codigo: 'PC-01', sala: ' ' }), 'DATOS_INVALIDOS');
  });
  it('T-04 datos válidos', () => {
    expect(() => validarDatosEquipo({ codigo: 'PC-01', sala: 'Sala 1' })).not.toThrow();
  });
  it('T-05 los tres estados son válidos', () => {
    for (const estado of ['funcional', 'en_reparacion', 'dado_de_baja']) {
      expect(esEstadoEquipoValido(estado)).toBe(true);
    }
  });
  it('T-06 estado inexistente', () => {
    expect(esEstadoEquipoValido('roto')).toBe(false);
  });
});
