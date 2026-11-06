// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LARGO_MAXIMO_COMENTARIO } from '@/lib/config/soporte';
import { motivoSinComentarios, puedeComentar, puedeLeerComentarios, validarComentario } from '@/lib/reglas/comentario';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const soporte = { soporte: true, esQuienReporto: false };
const quienReporto = { soporte: false, esQuienReporto: true };
const otraCuenta = { soporte: false, esQuienReporto: false };

describe('comentarios de una incidencia', () => {
  it('limpia el texto y exige entre 2 y el máximo de caracteres', () => {
    expect(validarComentario('  Se cambió la RAM.  ')).toBe('Se cambió la RAM.');
    expect(() => validarComentario(' x ')).toThrow(ErrorDeNegocio);
    expect(() => validarComentario('a'.repeat(LARGO_MAXIMO_COMENTARIO + 1))).toThrow(ErrorDeNegocio);
    expect(validarComentario('a'.repeat(LARGO_MAXIMO_COMENTARIO))).toHaveLength(LARGO_MAXIMO_COMENTARIO);
  });

  it('leen la conversación soporte y quien reportó; nadie más', () => {
    expect(puedeLeerComentarios(soporte)).toBe(true);
    expect(puedeLeerComentarios(quienReporto)).toBe(true);
    expect(puedeLeerComentarios(otraCuenta)).toBe(false);
  });

  it('se escribe mientras el caso no esté cerrado', () => {
    expect(puedeComentar(soporte, 'abierta')).toBe(true);
    expect(puedeComentar(quienReporto, 'en_revision')).toBe(true);
    expect(puedeComentar(soporte, 'cerrada')).toBe(false);
    expect(puedeComentar(quienReporto, 'cerrada')).toBe(false);
    expect(puedeComentar(otraCuenta, 'abierta')).toBe(false);
  });

  it('explica por qué no se puede escribir', () => {
    expect(motivoSinComentarios(soporte, 'abierta')).toBeNull();
    expect(motivoSinComentarios(quienReporto, 'cerrada')).toMatch(/cerrado/);
    expect(motivoSinComentarios(otraCuenta, 'abierta')).toMatch(/Solo soporte/);
  });
});
