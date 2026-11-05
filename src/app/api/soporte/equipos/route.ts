import { exigirSesion, exigirSoporte } from '@/lib/auth/sesion';
import { crearEquipo, listarEquipos, paginarEquipos } from '@/lib/dataService';
import { TAMANO_PAGINA_EQUIPOS } from '@/lib/config/soporte';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { normalizarPagina } from '@/lib/reglas/paginacion';
import { esquemaEquipo, esquemaFiltrosEquipos } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Sin ?pagina responde la lista (como antes); con ?pagina=N responde { filas, total, pagina, ... }.
export const GET = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const parametros = new URL(request.url).searchParams;
  const filtros = esquemaFiltrosEquipos.parse(Object.fromEntries(parametros));
  if (!parametros.has('pagina')) return responderOk(await listarEquipos(filtros));
  const pagina = normalizarPagina(parametros.get('pagina'));
  return responderOk(await paginarEquipos(filtros, pagina, TAMANO_PAGINA_EQUIPOS));
});

export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const datos = esquemaEquipo.parse(await leerCuerpo(request));
  return responderOk(await crearEquipo(datos), 201);
});
