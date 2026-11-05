// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { TAMANO_MAXIMO_FOTO, tipoDeImagen, validarFoto } from '@/lib/reglas/foto';

const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0))));

describe('foto de una incidencia', () => {
  it('reconoce JPG, PNG y WebP por su contenido', () => {
    expect(tipoDeImagen(jpg)).toBe('image/jpeg');
    expect(tipoDeImagen(png)).toBe('image/png');
    expect(tipoDeImagen(webp)).toBe('image/webp');
  });

  it('rechaza lo que no es imagen aunque se llame .jpg', () => {
    const html = new TextEncoder().encode('<html><script>alert(1)</script>');
    expect(validarFoto(html)).toEqual({ error: 'La foto debe ser JPG, PNG o WebP.' });
    const gif = new TextEncoder().encode('GIF89a......');
    expect(tipoDeImagen(gif)).toBeNull();
  });

  it('rechaza una foto vacía o de más de 3 MB', () => {
    expect(validarFoto(new Uint8Array())).toEqual({ error: 'No se recibió ninguna foto.' });
    const grande = new Uint8Array(TAMANO_MAXIMO_FOTO + 1);
    grande.set(jpg);
    expect(validarFoto(grande)).toEqual({ error: 'La foto pesa más de 3 MB.' });
  });

  it('acepta una foto válida', () => {
    expect(validarFoto(jpg)).toEqual({ tipo: 'image/jpeg' });
  });
});
