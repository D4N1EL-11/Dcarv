import { exigirSesion } from '@/lib/auth/sesion';
import { contarSinLeer, marcarAvisosLeidos } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpoOpcional, responderOk } from '@/lib/http/respuestas';
import { esquemaAvisosLeidos } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// { ids: [..] } marca esos avisos; sin cuerpo, todos. Solo toca avisos de la cuenta que pregunta.
export const POST = conManejoDeErrores(async (request) => {
  const sesion = await exigirSesion();
  const { ids } = esquemaAvisosLeidos.parse(await leerCuerpoOpcional(request));
  const marcados = await marcarAvisosLeidos(sesion.id, ids);
  return responderOk({ marcados, sinLeer: await contarSinLeer(sesion.id) });
});
