import { exigirSoporte } from '@/lib/auth/sesion';
import { buscarGlobal } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaBusquedaGlobal } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// GET /api/soporte/buscar?q=texto → equipos, incidencias, salas y técnicos (5 de cada uno).
export const GET = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const { q } = esquemaBusquedaGlobal.parse(Object.fromEntries(new URL(request.url).searchParams));
  return responderOk(await buscarGlobal(q));
});
