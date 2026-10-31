import { exigirSesion } from '@/lib/auth/sesion';
import { listarIncidencias } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const parametros = Object.fromEntries(new URL(request.url).searchParams);
  return responderOk(await listarIncidencias(esquemaFiltrosIncidencias.parse(parametros)));
});
