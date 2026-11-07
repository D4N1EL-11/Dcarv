import { exigirSoporte } from '@/lib/auth/sesion';
import { CASOS_SIMILARES_IA, GUIAS_SUGERIDAS } from '@/lib/config/soporte';
import { buscarArticulos, casosSimilares, obtenerIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { sugerirSolucion } from '@/lib/ia';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaNumeroCaso } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

// Sugerencia de solución con IA, apoyada en casos cerrados parecidos y en las guías.
export const POST = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  const caso = await obtenerIncidencia(esquemaNumeroCaso.parse((await params).numero));
  if (!caso) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
  const [similares, guias] = await Promise.all([
    casosSimilares(caso.descripcion, CASOS_SIMILARES_IA, caso.numeroCaso),
    buscarArticulos(caso.descripcion, GUIAS_SUGERIDAS),
  ]);
  const sugerencia = await sugerirSolucion(caso.descripcion, caso.categoria, similares, guias);
  return responderOk({
    causaProbable: sugerencia.causaProbable,
    pasos: sugerencia.pasos,
    casos: similares
      .filter((c) => sugerencia.casosUtiles.includes(c.numeroCaso))
      .map(({ numeroCaso, equipo }) => ({ numeroCaso, equipo })),
    guias: guias.filter((g) => sugerencia.guiasUtiles.includes(g.id)).map(({ id, titulo }) => ({ id, titulo })),
  });
});
