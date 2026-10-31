import { reasignarIncidenciasVencidas } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

// RN-10. La invoca Vercel Cron (vercel.json), que envía CRON_SECRET como Bearer: no hay sesión.
export const GET = conManejoDeErrores(async (request) => {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    throw new ErrorDeNegocio('NO_AUTORIZADO');
  }
  return responderOk(await reasignarIncidenciasVencidas());
});
