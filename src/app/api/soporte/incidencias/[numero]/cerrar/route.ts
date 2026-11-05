import { exigirSesion } from '@/lib/auth/sesion';
import { cerrarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpoOpcional, responderOk } from '@/lib/http/respuestas';
import { esquemaCerrar } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Cuerpo opcional { equipoFuncional: true }: además de cerrar, devuelve el equipo a "funcional"
// si estaba en reparación y no le quedan incidencias pendientes (misma transacción).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSesion();
  const { numero } = await params;
  const { equipoFuncional } = esquemaCerrar.parse(await leerCuerpoOpcional(request));
  const resultado = await cerrarIncidencia(numero, { equipoFuncional });
  return responderOk({ cerrada: true, ...resultado });
});
