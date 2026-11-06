// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DIAS_AVISO_MANTENIMIENTO } from '@/lib/config/soporte';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import {
  compararPlanes,
  estadoMantenimiento,
  proximoMantenimiento,
  textoVencimiento,
  validarFechaMantenimiento,
  validarFrecuencia,
  validarNotasMantenimiento,
} from '@/lib/reglas/mantenimiento';

const hoy = '2026-11-06';

describe('mantenimiento preventivo', () => {
  it('sin frecuencia no hay plan ni próxima fecha', () => {
    const plan = { cadaDias: null, desde: null, ultimo: '2026-10-01' };
    expect(proximoMantenimiento(plan)).toBeNull();
    expect(estadoMantenimiento(plan, hoy)).toBe('sin_plan');
  });

  it('la próxima fecha se cuenta desde el último mantenimiento o, sin ninguno, desde que se programó', () => {
    expect(proximoMantenimiento({ cadaDias: 30, desde: '2026-09-01', ultimo: '2026-10-20' })).toBe('2026-11-19');
    expect(proximoMantenimiento({ cadaDias: 30, desde: '2026-11-01', ultimo: null })).toBe('2026-12-01');
  });

  it('vencido, próximo o al día según cuánto falta', () => {
    const plan = (ultimo: string) => ({ cadaDias: 30, desde: null, ultimo });
    expect(estadoMantenimiento(plan('2026-10-01'), hoy)).toBe('vencido'); // tocaba el 31 de octubre
    expect(estadoMantenimiento(plan('2026-10-06'), hoy)).toBe('vencido'); // tocaba ayer
    expect(estadoMantenimiento(plan('2026-10-07'), hoy)).toBe('proximo'); // toca hoy
    expect(DIAS_AVISO_MANTENIMIENTO).toBe(7);
    expect(estadoMantenimiento(plan('2026-10-14'), hoy)).toBe('proximo'); // toca el 13 de noviembre: faltan 7
    expect(estadoMantenimiento(plan('2026-10-15'), hoy)).toBe('al_dia'); // faltan 8
    expect(estadoMantenimiento(plan('2026-10-30'), hoy)).toBe('al_dia');
  });

  it('textos de vencimiento', () => {
    expect(textoVencimiento('2026-11-06', hoy)).toBe('vence hoy');
    expect(textoVencimiento('2026-11-07', hoy)).toBe('vence mañana');
    expect(textoVencimiento('2026-11-11', hoy)).toBe('vence en 5 días');
    expect(textoVencimiento('2026-11-05', hoy)).toBe('vencido desde ayer');
    expect(textoVencimiento('2026-11-01', hoy)).toBe('vencido hace 5 días');
  });

  it('valida la frecuencia, la fecha y las notas', () => {
    expect(validarFrecuencia(30)).toBe(30);
    expect(() => validarFrecuencia(6)).toThrow(ErrorDeNegocio);
    expect(() => validarFrecuencia(366)).toThrow(ErrorDeNegocio);
    expect(() => validarFrecuencia(10.5)).toThrow(ErrorDeNegocio);
    expect(validarFechaMantenimiento('2026-11-06', hoy)).toBe('2026-11-06');
    expect(() => validarFechaMantenimiento('2026-11-07', hoy)).toThrow(/futura/);
    expect(() => validarFechaMantenimiento('2025-11-01', hoy)).toThrow(/más de un año/);
    expect(() => validarFechaMantenimiento('06/11/2026', hoy)).toThrow(/válida/);
    expect(validarNotasMantenimiento('  Limpieza  ')).toBe('Limpieza');
    expect(() => validarNotasMantenimiento('x'.repeat(501))).toThrow(ErrorDeNegocio);
  });

  it('ordena lo vencido primero (lo más atrasado arriba) y las salas sin plan al final', () => {
    const salas = [
      { nombre: 'Sala C', estado: 'sin_plan' as const, proximo: null },
      { nombre: 'Sala B', estado: 'al_dia' as const, proximo: '2026-12-01' },
      { nombre: 'Sala A', estado: 'vencido' as const, proximo: '2026-11-01' },
      { nombre: 'Sala D', estado: 'vencido' as const, proximo: '2026-10-20' },
      { nombre: 'Sala E', estado: 'proximo' as const, proximo: '2026-11-09' },
    ];
    expect([...salas].sort(compararPlanes).map((s) => s.nombre)).toEqual(['Sala D', 'Sala A', 'Sala E', 'Sala B', 'Sala C']);
  });
});
