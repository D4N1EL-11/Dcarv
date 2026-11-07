import { exigirSesion } from '@/lib/auth/sesion';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { clasificarFalla } from '@/lib/ia';
import { esquemaClasificarIa } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Sugerencia de categoría y prioridad mientras se reporta una falla (cualquier cuenta). Solo
// sugiere: quien reporta decide, y la prioridad la sigue fijando soporte.
export const POST = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const { descripcion } = esquemaClasificarIa.parse(await leerCuerpo(request));
  return responderOk(await clasificarFalla(descripcion));
});
