import { exigirSoporte } from '@/lib/auth/sesion';
import { crearRepuesto, listarRepuestos } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaRepuesto } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  await exigirSoporte();
  return responderOk(await listarRepuestos());
});

export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const datos = esquemaRepuesto.parse(await leerCuerpo(request));
  return responderOk(await crearRepuesto(datos), 201);
});
