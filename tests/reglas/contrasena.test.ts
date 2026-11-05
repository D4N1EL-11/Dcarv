// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { estaEnObservacion, esCandidatoABaja } from '@/lib/reglas/alertas';
import { evaluarContrasena } from '@/lib/reglas/contrasena';
import { formatearHora, textoPromedioDias, textoResolucion } from '@/lib/formato';

describe('evaluarContrasena', () => {
  it('menos de 8 caracteres no es válida', () => {
    const r = evaluarContrasena('Ab1!');
    expect(r.valida).toBe(false);
    expect(r.nivel).toBe(0);
    expect(r.etiqueta).toBe('Muy corta');
    expect(r.requisitos[0]?.cumple).toBe(false);
  });

  it('el nivel sube con cada requisito cumplido', () => {
    expect(evaluarContrasena('abcdefgx').nivel).toBe(1);
    expect(evaluarContrasena('abcdefg7').nivel).toBe(2);
    expect(evaluarContrasena('Abcdefg7').nivel).toBe(3);
    expect(evaluarContrasena('Abcdef.7').nivel).toBe(4);
    expect(evaluarContrasena('Abcdefghijk7').nivel).toBe(4);
  });

  it('las contraseñas comunes o repetidas son débiles aunque sean largas', () => {
    expect(evaluarContrasena('12345678')).toMatchObject({ nivel: 1, valida: true });
    expect(evaluarContrasena('Contraseña').consejo).toMatch(/común/);
    expect(evaluarContrasena('aaaaaaaaaaaa').nivel).toBe(1);
  });

  it('usar el correo dentro de la contraseña la vuelve débil', () => {
    const r = evaluarContrasena('Daniel.2026!', 'daniel@usa.edu.co');
    expect(r.nivel).toBe(1);
    expect(r.consejo).toMatch(/correo/);
  });

  it('cuenta caracteres, no bytes (ñ y tildes)', () => {
    expect(evaluarContrasena('ñandú12').valida).toBe(false);
    expect(evaluarContrasena('ñandú123').valida).toBe(true);
  });
});

describe('alertas tempranas', () => {
  it('en observación es exactamente una falla antes del umbral (3)', () => {
    expect(estaEnObservacion(1)).toBe(false);
    expect(estaEnObservacion(2)).toBe(true);
    expect(estaEnObservacion(3)).toBe(false);
    expect(esCandidatoABaja(2)).toBe(false);
  });
});

describe('formato de tiempos', () => {
  it('días hasta el cierre', () => {
    expect(textoResolucion(0)).toBe('resuelta el mismo día');
    expect(textoResolucion(1)).toBe('resuelta en 1 día');
    expect(textoResolucion(4)).toBe('resuelta en 4 días');
  });

  it('promedio de cierre con coma decimal', () => {
    expect(textoPromedioDias(null)).toBe('Sin cierres');
    expect(textoPromedioDias(0.04)).toBe('Mismo día');
    expect(textoPromedioDias(1)).toBe('1 día');
    expect(textoPromedioDias(2.46)).toBe('2,5 días');
  });

  it('la hora se muestra en Colombia (UTC−5)', () => {
    expect(formatearHora(new Date('2026-11-05T20:45:00Z'))).toMatch(/^3:45/);
  });
});
