import { exigirSesion } from '@/lib/auth/sesion';
import { LIMITE_EXPORTACION } from '@/lib/config/soporte';
import { paginarIncidencias } from '@/lib/dataService';
import { etiquetaEstadoIncidencia } from '@/lib/formato';
import { responderCsv } from '@/lib/http/descarga';
import { conManejoDeErrores } from '@/lib/http/respuestas';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Incidencias en CSV con los mismos filtros del listado (estado, búsqueda, equipo, técnico).
export const GET = conManejoDeErrores(async (request) => {
  await exigirSesion();
  const filtros = esquemaFiltrosIncidencias.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { filas } = await paginarIncidencias(filtros, 1, LIMITE_EXPORTACION);
  return responderCsv(
    'incidencias',
    ['Caso', 'Equipo', 'Estado', 'Fecha de reporte', 'Técnico', 'Descripción'],
    filas.map((i) => [
      i.numeroCaso,
      i.equipoCodigo,
      etiquetaEstadoIncidencia(i.estado),
      i.fecha,
      i.tecnico ?? '',
      i.descripcion,
    ]),
  );
});
