import { exigirSesion } from '@/lib/auth/sesion';
import { borrarSuscripcion, guardarSuscripcion } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaBajaPush, esquemaSuscripcionPush } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Activar las notificaciones push en este navegador (cualquier cuenta: los avisos son de todos).
export const POST = conManejoDeErrores(async (request) => {
  const sesion = await exigirSesion();
  await guardarSuscripcion(sesion.id, esquemaSuscripcionPush.parse(await leerCuerpo(request)));
  return responderOk({ activadas: true }, 201);
});

export const DELETE = conManejoDeErrores(async (request) => {
  const sesion = await exigirSesion();
  const { endpoint } = esquemaBajaPush.parse(await leerCuerpo(request));
  await borrarSuscripcion(sesion.id, endpoint);
  return responderOk({ desactivadas: true });
});
