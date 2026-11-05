// Solo en el navegador: reduce la foto antes de subirla (las del celular pesan 3–8 MB) y la envía.
import { MENSAJES } from '@/lib/reglas/errores';

const LADO_MAXIMO = 1600;
const CALIDAD = 0.8;

// Lado mayor de 1600 px en JPEG: suficiente para leer un mensaje de error en pantalla.
// createImageBitmap respeta la orientación de la cámara (EXIF).
export async function comprimirFoto(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d')?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error('compresion'))), 'image/jpeg', CALIDAD),
  );
}

export async function subirFotoIncidencia(
  numeroCaso: string,
  archivo: File,
): Promise<{ ok: true } | { ok: false; mensaje: string }> {
  // Si el navegador no sabe abrir el formato (p. ej. HEIC), se envía tal cual y el servidor decide.
  const contenido = await comprimirFoto(archivo).catch(() => archivo);
  const datos = new FormData();
  datos.append('foto', contenido, 'foto.jpg');
  try {
    const respuesta = await fetch(`/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/foto`, {
      method: 'POST',
      body: datos,
    });
    if (respuesta.ok) return { ok: true };
    const json = (await respuesta.json().catch(() => null)) as { error?: { mensaje?: string } } | null;
    return { ok: false, mensaje: json?.error?.mensaje ?? 'No se pudo subir la foto.' };
  } catch {
    return { ok: false, mensaje: MENSAJES.ERROR_INTERNO };
  }
}
