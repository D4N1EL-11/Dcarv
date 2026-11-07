import { exigirSoporte } from '@/lib/auth/sesion';
import { listarComentarios, obtenerIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { resumirCaso } from '@/lib/ia';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaNumeroCaso } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Resumen con IA del caso y su conversación.
export const POST = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  const caso = await obtenerIncidencia(esquemaNumeroCaso.parse((await params).numero));
  if (!caso) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
  return responderOk(await resumirCaso(caso, await listarComentarios(caso.numeroCaso)));
});
