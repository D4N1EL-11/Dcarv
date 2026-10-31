// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { esCandidatoABaja } from '@/lib/reglas/alertas';
import { dentroDeVentana, diasEntre, hoyBogota } from '@/lib/reglas/fechas';

const hoy = '2026-06-15';

describe('ventanas de fecha', () => {
  it('T-15 fecha dentro de los 30 días', () => {
    expect(dentroDeVentana('2026-06-01', hoy, DIAS_VENTANA_ALERTA)).toBe(true);
  });
  it('T-16 fecha a 36 días', () => {
    expect(dentroDeVentana('2026-05-10', hoy, DIAS_VENTANA_ALERTA)).toBe(false);
  });
  it('T-17 30 días exactos cuentan como dentro', () => {
    expect(dentroDeVentana('2026-05-16', hoy, DIAS_VENTANA_ALERTA)).toBe(true);
  });
  it('T-18 diasEntre', () => {
    expect(diasEntre('2026-06-10', hoy)).toBe(5);
  });
  it('hoyBogota usa UTC-5 aunque en UTC ya sea el día siguiente', () => {
    expect(hoyBogota(new Date('2026-06-16T03:00:00Z'))).toBe('2026-06-15');
  });
});

describe('candidatos a baja', () => {
  it('T-19 dos incidencias no alcanzan', () => {
    expect(esCandidatoABaja(2)).toBe(false);
  });
  it('T-20 tres incidencias alcanzan', () => {
    expect(esCandidatoABaja(3)).toBe(true);
  });
  it('T-21 cinco incidencias alcanzan', () => {
    expect(esCandidatoABaja(5)).toBe(true);
  });
});
