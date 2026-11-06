import { exigirSoporte } from '@/lib/auth/sesion';
import { programarMantenimiento } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaPlanMantenimiento } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Programar la frecuencia de una sala ({ salaId, cadaDias }) o quitar su plan ({ cadaDias: null }).
export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const { salaId, cadaDias } = esquemaPlanMantenimiento.parse(await leerCuerpo(request));
  await programarMantenimiento(salaId, cadaDias);
  return responderOk({ programado: cadaDias !== null });
});
