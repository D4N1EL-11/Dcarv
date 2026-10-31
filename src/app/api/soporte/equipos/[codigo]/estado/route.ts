import { exigirSesion } from '@/lib/auth/sesion';
import { cambiarEstadoEquipo } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaEstadoEquipo } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSesion();
  const { codigo } = await params;
  const cuerpo = esquemaEstadoEquipo.safeParse(await leerCuerpo(request));
  if (!cuerpo.success) throw new ErrorDeNegocio('ESTADO_INVALIDO'); // CU-04
  await cambiarEstadoEquipo(codigo, cuerpo.data.estado);
  return responderOk({ actualizado: true });
});
