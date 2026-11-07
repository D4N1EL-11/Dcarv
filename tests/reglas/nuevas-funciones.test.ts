// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { distribuirEquipos, validarColumnasMapa, validarPuesto } from '@/lib/reglas/mapa';
import { bajoMinimo, validarCantidad, validarExistencias, validarNombreRepuesto } from '@/lib/reglas/repuesto';
import { evaluarSla, textoHoras, textoSla } from '@/lib/reglas/sla';

const equipo = (codigo: string, fila: number | null = null, columna: number | null = null) => ({
  codigo,
  fila,
  columna,
});

describe('mapa de sala', () => {
  it('respeta los puestos guardados y llena los libres en orden de lectura', () => {
    const { filas, equipos } = distribuirEquipos(
      [equipo('PC-01'), equipo('PC-02', 1, 1), equipo('PC-03'), equipo('PC-04', 2, 2)],
      3,
    );
    expect(equipos.map((e) => [e.codigo, e.fila, e.columna, e.automatico])).toEqual([
      ['PC-01', 1, 2, true],
      ['PC-02', 1, 1, false],
      ['PC-03', 1, 3, true],
      ['PC-04', 2, 2, false],
    ]);
    expect(filas).toBe(2);
  });

  it('un puesto repetido o fuera del ancho del mapa se reubica', () => {
    const { equipos } = distribuirEquipos([equipo('A', 1, 1), equipo('B', 1, 1), equipo('C', 1, 9)], 2);
    expect(equipos.map((e) => [e.codigo, e.fila, e.columna])).toEqual([
      ['A', 1, 1],
      ['B', 1, 2],
      ['C', 2, 1],
    ]);
  });

  it('una sala vacía tiene al menos una fila', () => {
    expect(distribuirEquipos([], 6)).toEqual({ filas: 1, equipos: [] });
  });

  it('valida columnas y puestos', () => {
    expect(validarColumnasMapa(6)).toBe(6);
    expect(() => validarColumnasMapa(1)).toThrow(ErrorDeNegocio);
    expect(() => validarColumnasMapa(17)).toThrow(ErrorDeNegocio);
    expect(validarPuesto({ fila: 3, columna: 4 }, 4)).toEqual({ fila: 3, columna: 4 });
    expect(() => validarPuesto({ fila: 1, columna: 5 }, 4)).toThrow(ErrorDeNegocio);
    expect(() => validarPuesto({ fila: 0, columna: 1 }, 4)).toThrow(ErrorDeNegocio);
  });
});

describe('tiempos de atención (SLA)', () => {
  const creadaEn = '2026-11-07T10:00:00Z';
  const a = (horas: number) => new Date(Date.parse(creadaEn) + horas * 3_600_000);

  it('un caso abierto pasa de a tiempo a por vencer y a vencido', () => {
    expect(evaluarSla({ prioridad: 'alta', creadaEn, cerradaEn: null }, a(10)).estado).toBe('a_tiempo');
    expect(evaluarSla({ prioridad: 'alta', creadaEn, cerradaEn: null }, a(20)).estado).toBe('por_vencer');
    expect(evaluarSla({ prioridad: 'alta', creadaEn, cerradaEn: null }, a(30)).estado).toBe('vencido');
  });

  it('la meta depende de la prioridad', () => {
    expect(evaluarSla({ prioridad: 'media', creadaEn, cerradaEn: null }, a(30)).estado).toBe('a_tiempo');
    expect(evaluarSla({ prioridad: 'baja', creadaEn, cerradaEn: null }, a(30)).metaHoras).toBe(168);
  });

  it('un caso cerrado cumple o incumple según cuándo se cerró, no según ahora', () => {
    const cerrado = { prioridad: 'alta' as const, creadaEn, cerradaEn: a(5).toISOString() };
    expect(evaluarSla(cerrado, a(100)).estado).toBe('cumplido');
    expect(evaluarSla({ ...cerrado, cerradaEn: a(25).toISOString() }, a(26)).estado).toBe('incumplido');
  });

  it('textos de duración', () => {
    expect(textoHoras(0.5)).toBe('30 min');
    expect(textoHoras(5)).toBe('5 h');
    expect(textoHoras(51)).toBe('2 d 3 h');
    expect(textoHoras(48)).toBe('2 d');
    expect(textoSla(evaluarSla({ prioridad: 'alta', creadaEn, cerradaEn: null }, a(19)))).toBe('Vence en 5 h');
    expect(textoSla(evaluarSla({ prioridad: 'alta', creadaEn, cerradaEn: null }, a(26)))).toBe('Vencido hace 2 h');
  });
});

describe('repuestos', () => {
  it('normaliza y valida el nombre', () => {
    expect(validarNombreRepuesto('  Memoria   RAM 8 GB ')).toBe('Memoria RAM 8 GB');
    expect(() => validarNombreRepuesto('x')).toThrow(ErrorDeNegocio);
  });

  it('valida cantidades y existencias', () => {
    expect(validarCantidad(3)).toBe(3);
    expect(() => validarCantidad(0)).toThrow(ErrorDeNegocio);
    expect(() => validarCantidad(1.5)).toThrow(ErrorDeNegocio);
    expect(validarExistencias(0)).toBe(0);
    expect(() => validarExistencias(-1)).toThrow(ErrorDeNegocio);
  });

  it('avisa bajo mínimo o agotado', () => {
    expect(bajoMinimo({ existencias: 2, minimo: 3 })).toBe(true);
    expect(bajoMinimo({ existencias: 0, minimo: 0 })).toBe(true);
    expect(bajoMinimo({ existencias: 3, minimo: 3 })).toBe(false);
  });
});
