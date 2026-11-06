// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { elegirSecreto, ErrorConfiguracionSesion } from '@/lib/auth/secreto';

describe('clave de las sesiones (JWT_SECRET)', () => {
  it('usa la variable cuando existe, sin espacios alrededor', () => {
    expect(elegirSecreto('  clave-larga-y-aleatoria  ', 'production')).toBe('clave-larga-y-aleatoria');
    expect(elegirSecreto('otra', 'development')).toBe('otra');
  });

  it('en producción, sin la variable, se niega a firmar (nunca la clave de reserva del código)', () => {
    expect(() => elegirSecreto(undefined, 'production')).toThrow(ErrorConfiguracionSesion);
    expect(() => elegirSecreto('', 'production')).toThrow(ErrorConfiguracionSesion);
    expect(() => elegirSecreto('   ', 'production')).toThrow(ErrorConfiguracionSesion);
  });

  it('en desarrollo y pruebas, sin la variable, usa la reserva local', () => {
    expect(elegirSecreto(undefined, 'development')).toBe('development-only-secret-change-me');
    expect(elegirSecreto(undefined, 'test')).toBe('development-only-secret-change-me');
  });
});
