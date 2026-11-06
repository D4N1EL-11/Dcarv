import { exigirSesion } from '@/lib/auth/sesion';
import { AVISOS_EN_CAMPANA } from '@/lib/config/soporte';
import { avisosDe } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaListaAvisos } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Avisos de la cuenta que pregunta (nunca los de otra): los más recientes y cuántos faltan por leer.
// ?limite=1 sirve para consultar solo el número de la campana.
export const GET = conManejoDeErrores(async (request) => {
  const sesion = await exigirSesion();
  const parametros = Object.fromEntries(new URL(request.url).searchParams);
  const { antesDe, limite, soloSinLeer } = esquemaListaAvisos.parse(parametros);
  return responderOk(
    await avisosDe(sesion.id, { limite: limite ?? AVISOS_EN_CAMPANA, antesDe, soloSinLeer: soloSinLeer === '1' }),
  );
});
