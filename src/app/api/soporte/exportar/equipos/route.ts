import { exigirSoporte } from '@/lib/auth/sesion';
import { LIMITE_EXPORTACION } from '@/lib/config/soporte';
import { paginarEquipos } from '@/lib/dataService';
import { etiquetaEstadoEquipo } from '@/lib/formato';
import { responderCsv } from '@/lib/http/descarga';
import { conManejoDeErrores } from '@/lib/http/respuestas';
import { esquemaFiltrosEquipos } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Inventario en CSV con los mismos filtros del panel (sala, estado, búsqueda).
export const GET = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const filtros = esquemaFiltrosEquipos.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { filas } = await paginarEquipos(filtros, 1, LIMITE_EXPORTACION);
  return responderCsv(
    'equipos',
    ['Código', 'Sala', 'Estado', 'Incidencias (30 días)'],
    filas.map((e) => [e.codigo, e.sala, etiquetaEstadoEquipo(e.estado), e.incidencias30d]),
  );
});
