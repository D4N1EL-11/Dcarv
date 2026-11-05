import { exigirSoporte } from '@/lib/auth/sesion';
import { listarCandidatosABaja } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  await exigirSoporte();
  return responderOk(await listarCandidatosABaja());
});
