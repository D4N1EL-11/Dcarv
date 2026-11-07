import { exigirSoporte } from '@/lib/auth/sesion';
import { cambiarColumnasMapa, mapaDeSala } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaColumnasMapa, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  return responderOk(await mapaDeSala(esquemaId.parse((await params).id)));
});

// Cambiar el ancho (columnas) del mapa de la sala.
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const id = esquemaId.parse((await params).id);
  const { columnas } = esquemaColumnasMapa.parse(await leerCuerpo(request));
  await cambiarColumnasMapa(id, columnas);
  return responderOk({ actualizado: true });
});
