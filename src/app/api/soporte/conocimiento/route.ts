import { exigirSesion, exigirSoporte } from '@/lib/auth/sesion';
import { buscarArticulos, crearArticulo } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaArticulo, esquemaBusquedaConocimiento } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Buscar guías (cualquier cuenta: se sugieren al reportar una falla).
export const GET = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const { q, limite } = esquemaBusquedaConocimiento.parse(Object.fromEntries(new URL(request.url).searchParams));
  const articulos = await buscarArticulos(q ?? '', limite ?? 20);
  return responderOk(articulos.map(({ id, titulo, categoria, utilSi, utilNo }) => ({ id, titulo, categoria, utilSi, utilNo })));
});

export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  return responderOk(await crearArticulo(esquemaArticulo.parse(await leerCuerpo(request))), 201);
});
