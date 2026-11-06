import { exigirSesionVigente } from '@/lib/auth/sesion';
import { esSoporte } from '@/lib/auth/permisos';
import { agregarComentario, datosDeFoto, listarComentarios } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { puedeLeerComentarios } from '@/lib/reglas/comentario';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaComentario, esquemaNumeroCaso } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Conversación de un caso: soporte la ve en todos; una cuenta de reporte, solo en los suyos.
// A un caso ajeno se responde "no existe" (404) para no revelar qué casos hay.
export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  const sesion = await exigirSesionVigente();
  const numero = esquemaNumeroCaso.parse((await params).numero);
  const caso = await datosDeFoto(numero);
  if (!puedeLeerComentarios({ soporte: esSoporte(sesion.rol), esQuienReporto: caso.reportadoPor === sesion.id })) {
    throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
  }
  return responderOk(await listarComentarios(numero));
});

// El rol se lee de la base: una cuenta a la que le quitaron soporte escribe como quien reportó solo
// si de verdad reportó ese caso (la propiedad se comprueba en la transacción).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSesionVigente();
  const numero = esquemaNumeroCaso.parse((await params).numero);
  const { texto } = esquemaComentario.parse(await leerCuerpo(request));
  const comentario = await agregarComentario(numero, texto, {
    id: sesion.id,
    email: sesion.email,
    soporte: esSoporte(sesion.rol),
  });
  return responderOk(comentario, 201);
});
