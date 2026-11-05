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

describe('texto del registro de cambios', () => {
  it('describe cada acción en una frase', async () => {
    const { textoEvento } = await import('@/lib/formato');
    const base = { equipoCodigo: null, numeroCaso: null, detalle: '' };
    expect(textoEvento({ ...base, accion: 'incidencia_reportada', numeroCaso: 'INC-0080', equipoCodigo: 'PC-01', detalle: 'No enciende' })).toBe(
      'reportó INC-0080 en PC-01: “No enciende”',
    );
    expect(textoEvento({ ...base, accion: 'estado_equipo', equipoCodigo: 'PC-01', detalle: 'Funcional → Dado de baja' })).toBe(
      'cambió el estado de PC-01: Funcional → Dado de baja',
    );
    expect(textoEvento({ ...base, accion: 'incidencia_asignada', numeroCaso: 'INC-0080', detalle: 'a Ana' })).toBe('asignó INC-0080 a Ana');
    expect(textoEvento({ ...base, accion: 'equipo_registrado', equipoCodigo: 'PC-02', detalle: 'en Sala 1' })).toBe('registró el equipo PC-02 en Sala 1');
    expect(textoEvento({ ...base, accion: 'sala_eliminada', detalle: 'Sala 9' })).toBe('eliminó la sala Sala 9');
    expect(textoEvento({ ...base, accion: 'rol_cambiado', detalle: 'ana@gmail.com: Cuenta de reporte → Soporte técnico' })).toBe(
      'cambió el rol de ana@gmail.com: Cuenta de reporte → Soporte técnico',
    );
  });
});
