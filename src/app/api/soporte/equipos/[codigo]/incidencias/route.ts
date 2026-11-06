import { esSoporte } from '@/lib/auth/permisos';
import { exigirSesionVigente, exigirSoporte } from '@/lib/auth/sesion';
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

// Reportar es lo único que puede hacer cualquier cuenta: queda anotado quién reportó. La categoría
// la elige quien reporta; la prioridad solo la fija soporte (a una cuenta de reporte se le ignora).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSesionVigente();
  const { codigo } = await params;
  const { descripcion, categoria, prioridad } = esquemaIncidencia.parse(await leerCuerpo(request));
  return responderOk(
    await reportarIncidencia(codigo, descripcion, {
      reportadoPor: sesion.id,
      categoria,
      prioridad: esSoporte(sesion.rol) ? prioridad : undefined,
    }),
    201,
  );
});
