import { exigirSoporte } from '@/lib/auth/sesion';
import { cambiarActividadTecnico, renombrarTecnico } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaActualizarTecnico, esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

// { nombre } renombra; { activo } activa o desactiva. Al desactivar, sus casos en revisión
// pasan a los técnicos activos con menos carga y la respuesta dice cuántos se movieron.
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const id = esquemaId.parse((await params).id);
  const datos = esquemaActualizarTecnico.parse(await leerCuerpo(request));
  if (datos.nombre !== undefined) await renombrarTecnico(id, datos.nombre);
  const actividad = datos.activo === undefined ? null : await cambiarActividadTecnico(id, datos.activo);
  return responderOk({ actualizado: true, actividad });
});
