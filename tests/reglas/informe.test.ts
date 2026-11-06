// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  compararMeses,
  mesDe,
  nombreMes,
  normalizarMes,
  proporcion,
  rangoDelMes,
  sumarMeses,
  textoMes,
  textoVariacion,
} from '@/lib/reglas/informe';

const hoy = '2026-11-06';

describe('informe mensual', () => {
  it('rango del mes con el último día correcto (incluidos febreros)', () => {
    expect(rangoDelMes({ anio: 2026, mes: 11 })).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' });
    expect(rangoDelMes({ anio: 2026, mes: 12 })).toEqual({ desde: '2026-12-01', hasta: '2026-12-31' });
    expect(rangoDelMes({ anio: 2028, mes: 2 })).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' });
    expect(rangoDelMes({ anio: 2026, mes: 2 })).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
  });

  it('suma y resta meses cruzando el año', () => {
    expect(sumarMeses({ anio: 2026, mes: 1 }, -1)).toEqual({ anio: 2025, mes: 12 });
    expect(sumarMeses({ anio: 2026, mes: 12 }, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(textoMes(sumarMeses({ anio: 2026, mes: 11 }, -10))).toBe('2026-01');
    expect(compararMeses({ anio: 2026, mes: 10 }, { anio: 2026, mes: 11 })).toBeLessThan(0);
  });

  it('?mes= mal escrito, vacío o futuro muestra el mes actual; nunca antes del primer registro', () => {
    const primero = { anio: 2026, mes: 9 };
    expect(normalizarMes(undefined, hoy, primero)).toEqual(mesDe(hoy));
    expect(normalizarMes('2026-13', hoy, primero)).toEqual(mesDe(hoy));
    expect(normalizarMes('noviembre', hoy, primero)).toEqual(mesDe(hoy));
    expect(normalizarMes('2027-01', hoy, primero)).toEqual({ anio: 2026, mes: 11 });
    expect(normalizarMes('2026-10', hoy, primero)).toEqual({ anio: 2026, mes: 10 });
    expect(normalizarMes('2025-01', hoy, primero)).toEqual(primero);
    expect(normalizarMes('2025-01', hoy, null)).toEqual({ anio: 2025, mes: 1 });
  });

  it('nombres, proporciones y variaciones para la pantalla', () => {
    expect(nombreMes({ anio: 2026, mes: 11 })).toBe('noviembre de 2026');
    expect(proporcion(3, 4)).toBe(75);
    expect(proporcion(0, 0)).toBeNull();
    expect(textoVariacion(5, 2)).toBe('+3 frente al mes anterior');
    expect(textoVariacion(2, 5)).toBe('−3 frente al mes anterior');
    expect(textoVariacion(4, 4)).toBe('igual que el mes anterior');
    expect(textoVariacion(4, null)).toBeNull();
  });
});
