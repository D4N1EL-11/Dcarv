import { exigirSesion } from '@/lib/auth/sesion';
import { calificarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCalificacion, esquemaNumeroCaso } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Solo quien reportó el caso, una vez y con el caso cerrado (lo comprueba lib/datos/calificaciones.ts).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSesion();
  const numero = esquemaNumeroCaso.parse((await params).numero);
  const { estrellas, comentario } = esquemaCalificacion.parse(await leerCuerpo(request));
  await calificarIncidencia(numero, sesion.id, estrellas, comentario);
  return responderOk({ calificada: true }, 201);
});
