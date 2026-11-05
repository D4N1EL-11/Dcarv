import { exigirSesion, exigirSoporte } from '@/lib/auth/sesion';
import { historialDeEquipo, reportarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaIncidencia } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

// El historial completo de un equipo es de soporte; una cuenta de reporte ve sus propios casos.
export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  const { codigo } = await params;
  return responderOk(await historialDeEquipo(codigo));
});

// Reportar es lo único que puede hacer cualquier cuenta: queda anotado quién reportó.
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSesion();
  const { codigo } = await params;
  const { descripcion } = esquemaIncidencia.parse(await leerCuerpo(request));
  return responderOk(await reportarIncidencia(codigo, descripcion, { reportadoPor: sesion.id }), 201);
});
