import { exigirSoporte } from '@/lib/auth/sesion';
import { historialMantenimientos, planDeMantenimiento, registrarMantenimiento } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaMantenimiento } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Plan de mantenimiento preventivo de cada sala (estado calculado para hoy) y los últimos registros.
export const GET = conManejoDeErrores(async () => {
  await exigirSoporte();
  const [plan, historial] = await Promise.all([planDeMantenimiento(), historialMantenimientos()]);
  return responderOk({ plan, historial });
});

// Registrar un mantenimiento hecho: { salaId, fecha (YYYY-MM-DD), notas? }.
export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const { salaId, fecha, notas } = esquemaMantenimiento.parse(await leerCuerpo(request));
  return responderOk(await registrarMantenimiento(salaId, fecha, notas), 201);
});
