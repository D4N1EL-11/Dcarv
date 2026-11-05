import { describe, expect, it } from 'vitest';
import { aCsv, BOM, celdaCsv } from '@/lib/csv';
import { formatearDiaCorto, tiempoRelativo } from '@/lib/formato';
import { completarSerie, repartirPorcentajes } from '@/lib/reglas/estadisticas';

describe('serie diaria de actividad', () => {
  it('rellena con ceros los días sin movimiento, ambos extremos incluidos', () => {
    const serie = completarSerie('2026-02-27', '2026-03-02', [
      { dia: '2026-02-28', tipo: 'reportadas', total: 2 },
      { dia: '2026-03-02', tipo: 'cerradas', total: 1 },
      { dia: '2026-03-02', tipo: 'reportadas', total: 3 },
    ]);
    expect(serie.map((p) => p.dia)).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
    expect(serie[1]).toEqual({ dia: '2026-02-28', reportadas: 2, cerradas: 0 });
    expect(serie[3]).toEqual({ dia: '2026-03-02', reportadas: 3, cerradas: 1 });
  });
  it('ignora fechas fuera del rango', () => {
    const serie = completarSerie('2026-06-01', '2026-06-02', [{ dia: '2026-05-31', tipo: 'reportadas', total: 9 }]);
    expect(serie.every((p) => p.reportadas === 0)).toBe(true);
  });
  it('30 días de ventana dan 31 puntos (hoy incluido)', () => {
    expect(completarSerie('2026-05-16', '2026-06-15', [])).toHaveLength(31);
  });
});

describe('porcentajes de la barra de estados', () => {
  it('suman exactamente 100', () => {
    for (const valores of [[1, 1, 1], [2, 1, 0], [7, 2, 1], [33, 33, 34], [1, 0, 0]]) {
      expect(repartirPorcentajes(valores).reduce((a, b) => a + b, 0)).toBe(100);
    }
    expect(repartirPorcentajes([1, 1, 1])).toEqual([34, 33, 33]);
  });
  it('sin equipos todo vale 0', () => {
    expect(repartirPorcentajes([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('tiempo relativo', () => {
  const ahora = new Date('2026-11-04T20:00:00Z');
  it('de minutos a días', () => {
    expect(tiempoRelativo('2026-11-04T19:59:30Z', ahora)).toBe('hace un momento');
    expect(tiempoRelativo('2026-11-04T19:15:00Z', ahora)).toBe('hace 45 min');
    expect(tiempoRelativo('2026-11-04T15:00:00Z', ahora)).toBe('hace 5 h');
    expect(tiempoRelativo('2026-11-03T18:00:00Z', ahora)).toBe('ayer');
    expect(tiempoRelativo('2026-10-30T20:00:00Z', ahora)).toBe('hace 5 días');
  });
  it('más de 30 días muestra la fecha', () => {
    expect(tiempoRelativo('2026-08-01T12:00:00Z', ahora)).not.toMatch(/^hace/);
  });
  it('un momento futuro (relojes desfasados) no da negativos', () => {
    expect(tiempoRelativo('2026-11-04T20:05:00Z', ahora)).toBe('hace un momento');
  });
  it('día corto para el eje', () => {
    expect(formatearDiaCorto('2026-11-04')).toMatch(/^4 nov/);
  });
});

describe('exportación CSV', () => {
  it('escapa separadores, comillas y saltos de línea', () => {
    expect(celdaCsv('simple')).toBe('simple');
    expect(celdaCsv('a;b')).toBe('"a;b"');
    expect(celdaCsv('dijo "hola"')).toBe('"dijo ""hola"""');
    expect(celdaCsv('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"');
    expect(celdaCsv(null)).toBe('');
    expect(celdaCsv(3)).toBe('3');
  });
  it('neutraliza fórmulas (inyección de CSV)', () => {
    expect(celdaCsv('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(celdaCsv('+57 300')).toBe("'+57 300");
    expect(celdaCsv('@SUM(A1)')).toBe("'@SUM(A1)");
  });
  it('agrega BOM, separador ; y CRLF', () => {
    const csv = aCsv(['Código', 'Sala'], [['PC-01', 'Sala 1']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('Código;Sala\r\nPC-01;Sala 1\r\n');
    expect(BOM).toHaveLength(1);
  });
});
