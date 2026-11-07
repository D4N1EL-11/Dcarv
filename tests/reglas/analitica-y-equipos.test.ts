// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mtbfDias, nivelRiesgo, puntajeRiesgo, tendencia } from '@/lib/reglas/analitica';
import { consultaWebsearch, terminosBusqueda } from '@/lib/reglas/busqueda';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { antiguedadAnios, esObsoleto, estadoGarantia, validarHojaDeVida, type HojaDeVida } from '@/lib/reglas/hojaDeVida';

const hoy = '2026-11-07';
const vacia: HojaDeVida = {
  marcaModelo: null,
  procesador: null,
  ramGb: null,
  discoGb: null,
  sistemaOperativo: null,
  numeroSerie: null,
  fechaCompra: null,
  garantiaHasta: null,
};

describe('hoja de vida', () => {
  it('estado de la garantía', () => {
    expect(estadoGarantia(null, hoy)).toBe('sin_dato');
    expect(estadoGarantia('2026-11-06', hoy)).toBe('vencida');
    expect(estadoGarantia('2026-12-01', hoy)).toBe('por_vencer');
    expect(estadoGarantia('2027-06-01', hoy)).toBe('vigente');
  });

  it('antigüedad y obsolescencia', () => {
    expect(antiguedadAnios(null, hoy)).toBeNull();
    expect(antiguedadAnios('2023-11-08', hoy)).toBe(2);
    expect(esObsoleto('2021-11-01', hoy)).toBe(true);
    expect(esObsoleto('2023-01-01', hoy)).toBe(false);
  });

  it('rechaza compra futura y garantía anterior a la compra', () => {
    expect(validarHojaDeVida({ ...vacia, fechaCompra: '2025-01-01' }, hoy).fechaCompra).toBe('2025-01-01');
    expect(() => validarHojaDeVida({ ...vacia, fechaCompra: '2027-01-01' }, hoy)).toThrow(ErrorDeNegocio);
    expect(() => validarHojaDeVida({ ...vacia, fechaCompra: '2025-01-01', garantiaHasta: '2024-12-31' }, hoy)).toThrow(
      ErrorDeNegocio,
    );
  });
});

describe('analítica', () => {
  it('MTBF: promedio de días entre fallas, sin importar el orden', () => {
    expect(mtbfDias(['2026-10-01'])).toBeNull();
    expect(mtbfDias(['2026-10-21', '2026-10-01', '2026-10-11'])).toBe(10);
  });

  it('tendencia: cambios pequeños son estables', () => {
    expect(tendencia(5, 4).tendencia).toBe('estable');
    expect(tendencia(10, 5)).toEqual({ tendencia: 'empeora', cambio: 100 });
    expect(tendencia(2, 8)).toEqual({ tendencia: 'mejora', cambio: -75 });
    expect(tendencia(3, 0)).toEqual({ tendencia: 'empeora', cambio: null });
  });

  it('riesgo: pesa más lo reciente y lo pendiente, con tope de 100', () => {
    const tranquilo = puntajeRiesgo({ fallas30d: 0, fallas90d: 1, pendientes: 0, aniosUso: 1, mtbf: null });
    const critico = puntajeRiesgo({ fallas30d: 3, fallas90d: 5, pendientes: 2, aniosUso: 6, mtbf: 7 });
    expect(nivelRiesgo(tranquilo)).toBe('bajo');
    expect(nivelRiesgo(critico)).toBe('alto');
    expect(puntajeRiesgo({ fallas30d: 10, fallas90d: 10, pendientes: 5, aniosUso: 10, mtbf: 1 })).toBe(100);
  });
});

describe('búsqueda', () => {
  it('deja solo palabras útiles, sin repetir', () => {
    expect(terminosBusqueda('¡La pantalla no enciende! La pantalla queda en negro, por favor')).toEqual([
      'pantalla',
      'enciende',
      'queda',
      'negro',
    ]);
    expect(consultaWebsearch('No hay red')).toBe('');
    expect(consultaWebsearch('Mouse dañado')).toBe('mouse or dañado');
  });
});
