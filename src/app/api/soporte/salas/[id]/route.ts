import { exigirSoporte } from '@/lib/auth/sesion';
import { eliminarSala, renombrarSala } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaId, esquemaSala } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

// Renombrar una sala: SALA_DUPLICADA si otra ya usa ese nombre (sin distinguir mayúsculas).
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const id = esquemaId.parse((await params).id);
  const { nombre } = esquemaSala.parse(await leerCuerpo(request));
  await renombrarSala(id, nombre);
  return responderOk({ actualizada: true });
});

// Eliminar una sala vacía: TIENE_DEPENDENCIAS (409) si todavía tiene equipos.
export const DELETE = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  const id = esquemaId.parse((await params).id);
  await eliminarSala(id);
  return responderOk({ eliminada: true });
});
