import { NextResponse } from 'next/server';
import { borrarFoto, subirFoto, urlFirmadaFoto } from '@/lib/almacenamiento';
import { esSoporte } from '@/lib/auth/permisos';
import { exigirSesion, type Sesion } from '@/lib/auth/sesion';
import { datosDeFoto, guardarFoto, type DatosFoto } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { validarFoto } from '@/lib/reglas/foto';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Soporte ve y cambia la foto de cualquier caso; una cuenta de reporte, solo la de los suyos.
async function incidenciaPermitida(sesion: Sesion, numero: string): Promise<DatosFoto> {
  const datos = await datosDeFoto(numero);
  if (!esSoporte(sesion.rol) && datos.reportadoPor !== sesion.id) throw new ErrorDeNegocio('SIN_PERMISO');
  return datos;
}

// Lleva a una URL firmada de pocos minutos: el bucket es privado y la foto nunca es pública.
export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  const sesion = await exigirSesion();
  const datos = await incidenciaPermitida(sesion, (await params).numero);
  if (!datos.foto) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA', 'Esta incidencia no tiene foto.');
  const respuesta = NextResponse.redirect(await urlFirmadaFoto(datos.foto), 302);
  respuesta.headers.set('Cache-Control', 'private, no-store');
  return respuesta;
});

// Cuerpo multipart con el campo "foto". El tipo se valida por el contenido del archivo.
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSesion();
  const numero = (await params).numero;
  const datos = await incidenciaPermitida(sesion, numero);

  let archivo: FormDataEntryValue | null;
  try {
    archivo = (await request.formData()).get('foto');
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Envíe la foto en el campo "foto".');
  }
  if (!(archivo instanceof Blob)) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Envíe la foto en el campo "foto".');

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const validacion = validarFoto(bytes);
  if ('error' in validacion) throw new ErrorDeNegocio('DATOS_INVALIDOS', validacion.error);

  const ruta = await subirFoto(numero, bytes, validacion.tipo);
  try {
    await guardarFoto(numero, ruta);
  } catch (error) {
    await borrarFoto(ruta).catch(() => undefined); // sin incidencia que la nombre, la foto sobra
    throw error;
  }
  if (datos.foto) await borrarFoto(datos.foto).catch(() => undefined); // la anterior se reemplaza
  return responderOk({ numeroCaso: numero }, 201);
});
