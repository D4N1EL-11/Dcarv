import { exigirSoporte } from '@/lib/auth/sesion';
import { crearTecnico, listarTecnicos } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaTecnico } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  await exigirSoporte();
  return responderOk(await listarTecnicos());
});

export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const { nombre } = esquemaTecnico.parse(await leerCuerpo(request));
  return responderOk(await crearTecnico(nombre), 201);
});
