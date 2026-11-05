import { exigirSesion, exigirSoporte } from '@/lib/auth/sesion';
import { crearSala, listarSalas } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaSala } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  await exigirSesion();
  return responderOk(await listarSalas());
});

export const POST = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const { nombre } = esquemaSala.parse(await leerCuerpo(request));
  return responderOk(await crearSala(nombre), 201);
});
