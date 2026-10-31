import { exigirSesion } from '@/lib/auth/sesion';
import { historialDeEquipo, reportarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaIncidencia } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSesion();
  const { codigo } = await params;
  return responderOk(await historialDeEquipo(codigo));
});

export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSesion();
  const { codigo } = await params;
  const { descripcion } = esquemaIncidencia.parse(await leerCuerpo(request));
  return responderOk(await reportarIncidencia(codigo, descripcion), 201);
});
