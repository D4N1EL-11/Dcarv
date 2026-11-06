import { exigirSoporte } from '@/lib/auth/sesion';
import { LIMITE_EXPORTACION } from '@/lib/config/soporte';
import { paginarIncidencias } from '@/lib/dataService';
import { etiquetaEstadoIncidencia } from '@/lib/formato';
import { ETIQUETA_CATEGORIA, ETIQUETA_PRIORIDAD } from '@/lib/reglas/clasificacion';
import { responderCsv } from '@/lib/http/descarga';
import { conManejoDeErrores } from '@/lib/http/respuestas';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

// Incidencias en CSV con los mismos filtros del listado (estado, búsqueda, equipo, técnico, sala,
// tipo de falla y prioridad).
export const GET = conManejoDeErrores(async (request) => {
  await exigirSoporte();
  const filtros = esquemaFiltrosIncidencias.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { filas } = await paginarIncidencias(filtros, 1, LIMITE_EXPORTACION);
  return responderCsv(
    'incidencias',
    ['Caso', 'Equipo', 'Estado', 'Prioridad', 'Tipo de falla', 'Fecha de reporte', 'Técnico', 'Reportó', 'Comentarios', 'Descripción'],
    filas.map((i) => [
      i.numeroCaso,
      i.equipoCodigo,
      etiquetaEstadoIncidencia(i.estado),
      ETIQUETA_PRIORIDAD[i.prioridad],
      ETIQUETA_CATEGORIA[i.categoria],
      i.fecha,
      i.tecnico ?? '',
      i.reportadoPor ?? '',
      i.comentarios,
      i.descripcion,
    ]),
  );
});
