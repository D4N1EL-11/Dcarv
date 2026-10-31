import { exigirSesion } from '@/lib/auth/sesion';
import { crearEquipo, listarEquipos } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaEquipo, esquemaFiltrosEquipos } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const parametros = Object.fromEntries(new URL(request.url).searchParams);
  return responderOk(await listarEquipos(esquemaFiltrosEquipos.parse(parametros)));
});

export const POST = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const datos = esquemaEquipo.parse(await leerCuerpo(request));
  return responderOk(await crearEquipo(datos), 201);
});
