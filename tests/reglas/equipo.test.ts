// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  esEstadoEquipoValido,
  generarCodigos,
  normalizarCodigo,
  validarDatosEquipo,
} from '@/lib/reglas/equipo';
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

describe('registro de varios equipos (generarCodigos)', () => {
  it('genera códigos consecutivos con ceros a la izquierda', () => {
    expect(generarCodigos('PC-SALA1-', 1, 3, 2)).toEqual(['PC-SALA1-01', 'PC-SALA1-02', 'PC-SALA1-03']);
  });
  it('recorta el prefijo y no corta números más largos que los dígitos', () => {
    expect(generarCodigos('  LAB-', 99, 101, 2)).toEqual(['LAB-99', 'LAB-100', 'LAB-101']);
  });
  it('un solo equipo cuando desde = hasta', () => {
    expect(generarCodigos('PC-', 7, 7, 3)).toEqual(['PC-007']);
  });
  it('prefijo vacío', () => {
    esperarCodigo(() => generarCodigos('  ', 1, 3, 2), 'DATOS_INVALIDOS');
  });
  it('rango invertido o no entero', () => {
    esperarCodigo(() => generarCodigos('PC-', 5, 1, 2), 'DATOS_INVALIDOS');
    esperarCodigo(() => generarCodigos('PC-', 1.5, 3, 2), 'DATOS_INVALIDOS');
  });
  it('dígitos fuera de 1 a 4', () => {
    esperarCodigo(() => generarCodigos('PC-', 1, 3, 0), 'DATOS_INVALIDOS');
    esperarCodigo(() => generarCodigos('PC-', 1, 3, 5), 'DATOS_INVALIDOS');
  });
  it('máximo 50 equipos por vez', () => {
    expect(generarCodigos('PC-', 1, 50, 2)).toHaveLength(50);
    esperarCodigo(() => generarCodigos('PC-', 1, 51, 2), 'DATOS_INVALIDOS');
  });
  it('ningún código pasa de 40 caracteres', () => {
    esperarCodigo(() => generarCodigos('X'.repeat(39), 1, 2, 2), 'DATOS_INVALIDOS');
  });
});
