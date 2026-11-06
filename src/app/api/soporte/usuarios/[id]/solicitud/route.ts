import { exigirSoporte } from '@/lib/auth/sesion';
import { decidirSolicitud } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaDecisionSolicitud, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

// Solo un administrador aprueba ({ aprobar: true } → Soporte técnico) o rechaza una solicitud de
// acceso de soporte. La persona recibe un aviso y su menú cambia en la siguiente página que abra.
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSoporte();
  if (sesion.rol !== 'admin') throw new ErrorDeNegocio('SIN_PERMISO', 'Solo un administrador puede aprobar solicitudes.');
  const id = esquemaId.parse((await params).id);
  const { aprobar } = esquemaDecisionSolicitud.parse(await leerCuerpo(request));
  await decidirSolicitud(id, aprobar);
  return responderOk({ aprobada: aprobar });
});
