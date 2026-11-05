import { exigirSoporte } from '@/lib/auth/sesion';
import { obtenerEquipo, trasladarEquipo } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaTraslado } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  const { codigo } = await params;
  return responderOk(await obtenerEquipo(codigo));
});

// Trasladar a otra sala: { salaId }. EQUIPO_NO_ENCONTRADO o SALA_NO_ENCONTRADA.
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const { codigo } = await params;
  const { salaId } = esquemaTraslado.parse(await leerCuerpo(request));
  return responderOk(await trasladarEquipo(codigo, salaId));
});
