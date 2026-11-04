// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatearFecha, plural, porcentaje, textoAntiguedad } from '@/lib/formato';

describe('formato para la interfaz', () => {
  it('antigüedad de una incidencia', () => {
    expect(textoAntiguedad(0)).toBe('hoy');
    expect(textoAntiguedad(1)).toBe('ayer');
    expect(textoAntiguedad(6)).toBe('hace 6 días');
    expect(textoAntiguedad(-1)).toBe('hoy');
  });
  it('porcentaje redondeado y sin dividir entre cero', () => {
    expect(porcentaje(2, 3)).toBe(67);
    expect(porcentaje(3, 3)).toBe(100);
    expect(porcentaje(0, 0)).toBe(0);
  });
  it('singular y plural', () => {
    expect(plural(1, 'equipo', 'equipos')).toBe('1 equipo');
    expect(plural(0, 'equipo', 'equipos')).toBe('0 equipos');
    expect(plural(12, 'equipo', 'equipos')).toBe('12 equipos');
  });
  it('la fecha no se corre de día por la zona horaria', () => {
    // El texto exacto depende de los datos de idioma de Node; lo importante es que sea el día 1, no el 31.
    expect(formatearFecha('2026-06-01')).toContain('2026');
    expect(formatearFecha('2026-06-01')).toMatch(/^0?1\D/);
  });
});
