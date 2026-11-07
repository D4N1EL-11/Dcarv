import { exigirSoporte } from '@/lib/auth/sesion';
import { actualizarRepuesto } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaActualizarRepuesto, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

// Registrar una entrada a bodega y/o cambiar el mínimo.
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const id = esquemaId.parse((await params).id);
  await actualizarRepuesto(id, esquemaActualizarRepuesto.parse(await leerCuerpo(request)));
  return responderOk({ actualizado: true });
});
