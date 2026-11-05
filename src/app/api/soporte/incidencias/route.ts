import { exigirSesion } from '@/lib/auth/sesion';
import { listarIncidencias, paginarIncidencias } from '@/lib/dataService';
import { TAMANO_PAGINA_INCIDENCIAS } from '@/lib/config/soporte';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { normalizarPagina } from '@/lib/reglas/paginacion';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Sin ?pagina responde la lista (como antes); con ?pagina=N responde { filas, total, pagina, ... }.
export const GET = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const parametros = new URL(request.url).searchParams;
  const filtros = esquemaFiltrosIncidencias.parse(Object.fromEntries(parametros));
  if (!parametros.has('pagina')) return responderOk(await listarIncidencias(filtros));
  const pagina = normalizarPagina(parametros.get('pagina'));
  return responderOk(await paginarIncidencias(filtros, pagina, TAMANO_PAGINA_INCIDENCIAS));
});
