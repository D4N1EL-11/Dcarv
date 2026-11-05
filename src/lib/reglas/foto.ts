// Validación de la foto de una incidencia por su contenido, no por el nombre ni por el tipo que
// declara el navegador (ambos se pueden falsear). Regla pura.

export const TAMANO_MAXIMO_FOTO = 3 * 1024 * 1024; // 3 MB, igual que el bucket (M6)

export type TipoImagen = 'image/jpeg' | 'image/png' | 'image/webp';

export const EXTENSION: Record<TipoImagen, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Firmas ("números mágicos") de los formatos aceptados.
export function tipoDeImagen(bytes: Uint8Array): TipoImagen | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return 'image/png';
  const texto = (desde: number, hasta: number) => String.fromCharCode(...bytes.slice(desde, hasta));
  if (bytes.length >= 12 && texto(0, 4) === 'RIFF' && texto(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export function validarFoto(bytes: Uint8Array): { tipo: TipoImagen } | { error: string } {
  if (!bytes.length) return { error: 'No se recibió ninguna foto.' };
  if (bytes.length > TAMANO_MAXIMO_FOTO) return { error: 'La foto pesa más de 3 MB.' };
  const tipo = tipoDeImagen(bytes);
  if (!tipo) return { error: 'La foto debe ser JPG, PNG o WebP.' };
  return { tipo };
}
