import { exigirSoporte } from '@/lib/auth/sesion';
import { cerrarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpoOpcional, responderOk } from '@/lib/http/respuestas';
import { esquemaCerrar } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Cuerpo opcional { equipoFuncional: true, nota: '...' }: además de cerrar, devuelve el equipo a
// "funcional" si estaba en reparación y no le quedan incidencias pendientes, y deja la nota de
// solución como último comentario del caso (todo en la misma transacción).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const { numero } = await params;
  const { equipoFuncional, nota } = esquemaCerrar.parse(await leerCuerpoOpcional(request));
  const resultado = await cerrarIncidencia(numero, { equipoFuncional, nota });
  return responderOk({ cerrada: true, ...resultado });
});
