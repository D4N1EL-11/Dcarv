import { exigirSesion, exigirSoporte } from '@/lib/auth/sesion';
import { editarArticulo, eliminarArticulo, obtenerArticulo } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaArticulo, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSesion();
  return responderOk(await obtenerArticulo(esquemaId.parse((await params).id)));
});

export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const id = esquemaId.parse((await params).id);
  await editarArticulo(id, esquemaArticulo.parse(await leerCuerpo(request)));
  return responderOk({ actualizado: true });
});

export const DELETE = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  await eliminarArticulo(esquemaId.parse((await params).id));
  return responderOk({ eliminado: true });
});
