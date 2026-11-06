import { exigirSoporte } from '@/lib/auth/sesion';
import { clasificarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaClasificar, esquemaNumeroCaso } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Soporte corrige la categoría o fija la prioridad de un caso. Queda en el registro de cambios.
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const numero = esquemaNumeroCaso.parse((await params).numero);
  const cambios = esquemaClasificar.parse(await leerCuerpo(request));
  return responderOk(await clasificarIncidencia(numero, cambios));
});
