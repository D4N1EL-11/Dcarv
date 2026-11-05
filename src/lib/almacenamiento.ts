import { randomUUID } from 'node:crypto';
import { EXTENSION, type TipoImagen } from '@/lib/reglas/foto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Fotos de incidencias en Supabase Storage (bucket privado "incidencias", migración M6).
// Solo el servidor sube y firma URLs con la clave privada; el navegador nunca toca el bucket.
const BUCKET = 'incidencias';

export async function subirFoto(numeroCaso: string, bytes: Uint8Array, tipo: TipoImagen): Promise<string> {
  const ruta = `${numeroCaso}/${randomUUID()}.${EXTENSION[tipo]}`;
  const { error } = await createSupabaseAdminClient()
    .storage.from(BUCKET)
    .upload(ruta, bytes, { contentType: tipo, upsert: false, cacheControl: '3600' });
  if (error) throw new Error(`No se pudo guardar la foto: ${error.message}`);
  return ruta;
}

// URL de corta duración: quien la vea sin sesión después de unos minutos ya no puede abrirla.
export async function urlFirmadaFoto(ruta: string, segundos = 300): Promise<string> {
  const { data, error } = await createSupabaseAdminClient().storage.from(BUCKET).createSignedUrl(ruta, segundos);
  if (error || !data?.signedUrl) throw new Error('No se pudo abrir la foto.');
  return data.signedUrl;
}

export async function borrarFoto(ruta: string): Promise<void> {
  await createSupabaseAdminClient().storage.from(BUCKET).remove([ruta]);
}
