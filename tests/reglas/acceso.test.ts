// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { evaluarBloqueo, MAXIMO_INTENTOS_FALLIDOS, type Intento } from '@/lib/reglas/acceso';

const ahora = new Date('2026-11-05T15:00:00Z');
const haceMin = (minutos: number) => new Date(ahora.getTime() - minutos * 60_000).toISOString();
const fallo = (minutos: number): Intento => ({ exito: false, momento: haceMin(minutos) });

describe('freno a los intentos de inicio de sesión', () => {
  it('sin intentos no hay bloqueo y quedan todos', () => {
    expect(evaluarBloqueo([], ahora)).toEqual({ bloqueado: false, minutosRestantes: 0, intentosRestantes: MAXIMO_INTENTOS_FALLIDOS });
  });

  it('cuatro fallos seguidos avisan que queda uno', () => {
    expect(evaluarBloqueo([fallo(1), fallo(2), fallo(3), fallo(4)], ahora)).toMatchObject({ bloqueado: false, intentosRestantes: 1 });
  });

  it('cinco fallos seguidos bloquean 15 minutos desde el último', () => {
    const r = evaluarBloqueo([fallo(2), fallo(3), fallo(4), fallo(5), fallo(6)], ahora);
    expect(r.bloqueado).toBe(true);
    expect(r.minutosRestantes).toBe(13);
  });

  it('un acceso correcto reinicia la cuenta de fallos', () => {
    const r = evaluarBloqueo([fallo(1), fallo(2), { exito: true, momento: haceMin(3) }, fallo(4), fallo(5), fallo(6)], ahora);
    expect(r).toMatchObject({ bloqueado: false, intentosRestantes: 3 });
  });

  it('los fallos de hace más de 15 minutos no cuentan', () => {
    expect(evaluarBloqueo([fallo(16), fallo(17), fallo(18), fallo(19), fallo(20)], ahora).bloqueado).toBe(false);
    expect(evaluarBloqueo([fallo(1), fallo(2), fallo(3), fallo(4), fallo(30)], ahora)).toMatchObject({ bloqueado: false, intentosRestantes: 1 });
  });

  it('al terminar la espera se puede intentar de nuevo', () => {
    expect(evaluarBloqueo([fallo(15.5), fallo(16), fallo(17), fallo(18), fallo(19)], ahora).bloqueado).toBe(false);
  });
});
