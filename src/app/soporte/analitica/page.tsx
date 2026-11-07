import type { Metadata } from 'next';
import Link from 'next/link';
import { MapaDeCalor } from '@/components/soporte/MapaDeCalor';
import { BloquePanel, EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono } from '@/components/ui/Icono';
import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';
import { soloSoporte } from '@/lib/auth/sesion';
import { DIAS_ANALITICA, DIAS_MTBF, DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { mapaDeCalor, riesgoDeEquipos, tendenciaDeSalas } from '@/lib/dataService';
import type { NivelRiesgo, Tendencia } from '@/lib/reglas/analitica';

export const metadata: Metadata = { title: 'Analítica' };

const EQUIPOS_EN_RIESGO = 12;

const TONO_RIESGO: Record<NivelRiesgo, TonoInsignia> = { alto: 'baja', medio: 'reparacion', bajo: 'neutro' };
const TEXTO_RIESGO: Record<NivelRiesgo, string> = { alto: 'Riesgo alto', medio: 'Riesgo medio', bajo: 'Riesgo bajo' };

const TENDENCIA: Record<Tendencia, { texto: string; tono: TonoInsignia; flecha: string }> = {
  empeora: { texto: 'Empeora', tono: 'baja', flecha: '↑' },
  mejora: { texto: 'Mejora', tono: 'funcional', flecha: '↓' },
  estable: { texto: 'Estable', tono: 'neutro', flecha: '→' },
};

function textoDias(dias: number | null): string {
  if (dias === null) return '—';
  return dias < 1 ? 'menos de 1 día' : `${Math.round(dias)} ${Math.round(dias) === 1 ? 'día' : 'días'}`;
}

// Analítica: cuándo se concentran los reportes, hacia dónde va cada sala y qué equipos tienen más
// riesgo de volver a fallar (lib/reglas/analitica.ts explica cada cálculo).
export default async function PaginaAnalitica() {
  await soloSoporte();
  const [calor, riesgo, tendencias] = await Promise.all([mapaDeCalor(), riesgoDeEquipos(), tendenciaDeSalas()]);
  const enRiesgo = riesgo.filter((e) => e.nivel !== 'bajo').slice(0, EQUIPOS_EN_RIESGO);
  const conMtbf = riesgo.filter((e) => e.mtbf !== null).sort((a, b) => a.mtbf! - b.mtbf!);

  return (
    <>
      <EncabezadoPagina
        etiqueta="Análisis"
        titulo="Analítica"
        descripcion={`Patrones de las fallas para anticiparse: cuándo se reportan, cada cuánto falla cada equipo (tiempo medio entre fallas, MTBF, de los últimos ${DIAS_MTBF} días) y qué equipos tienen más riesgo de volver a fallar.`}
      />

      <BloquePanel titulo="Cuándo se reportan las fallas">
        <MapaDeCalor datos={calor} />
      </BloquePanel>

      <section aria-labelledby="titulo-riesgo" className="grid gap-5">
        <TituloSeccion id="titulo-riesgo" titulo="Equipos con riesgo de falla">
          <p className="max-w-xl text-sm text-texto-suave">
            Puntaje de 0 a 100: pesan las fallas de los últimos {DIAS_VENTANA_ALERTA} y {DIAS_ANALITICA} días, los casos sin cerrar,
            la edad del equipo y las fallas muy seguidas.
          </p>
        </TituloSeccion>
        {enRiesgo.length ? (
          <div className="overflow-x-auto rounded-xl border border-borde bg-superficie">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-texto-suave">
                <tr className="border-b border-borde">
                  <th scope="col" className="px-5 py-3 font-medium">Equipo</th>
                  <th scope="col" className="px-5 py-3 font-medium">Riesgo</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Fallas {DIAS_VENTANA_ALERTA} d</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Fallas {DIAS_ANALITICA} d</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Sin cerrar</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">MTBF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {enRiesgo.map((e) => (
                  <tr key={e.codigo} className="transition hover:bg-superficie-alta">
                    <th scope="row" className="px-5 py-3 text-left font-medium">
                      <Link href={`/soporte/equipos/${encodeURIComponent(e.codigo)}`} className="text-primario underline-offset-4 hover:underline">
                        {e.codigo}
                      </Link>
                      <span className="block text-xs font-normal text-texto-suave">
                        {e.sala}
                        {e.aniosUso !== null ? ` · ${e.aniosUso} ${e.aniosUso === 1 ? 'año' : 'años'} de uso` : ''}
                      </span>
                    </th>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className="w-8 text-right font-semibold tabular-nums">{e.puntaje}</span>
                        <span aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-borde">
                          <span className="block h-full rounded-full bg-texto-suave" style={{ width: `${e.puntaje}%` }} />
                        </span>
                        <Insignia tono={TONO_RIESGO[e.nivel]} texto={TEXTO_RIESGO[e.nivel]} />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{e.fallas30d}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{e.fallas90d}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{e.pendientes}</td>
                    <td className="px-5 py-3 text-right text-texto-suave">{textoDias(e.mtbf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EstadoVacio titulo="Ningún equipo con riesgo medio o alto" icono="check">
            No hay fallas recientes que hagan pensar en una recaída.
          </EstadoVacio>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BloquePanel titulo={`Tendencia por sala · últimos ${DIAS_VENTANA_ALERTA} días frente a los ${DIAS_VENTANA_ALERTA} anteriores`}>
          {tendencias.length ? (
            <ul className="divide-y divide-borde">
              {tendencias.map((t) => {
                const estilo = TENDENCIA[t.tendencia];
                return (
                  <li key={t.salaId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                    <span className="font-medium">{t.sala}</span>
                    <span className="flex items-center gap-3 text-sm text-texto-suave">
                      <span className="tabular-nums">
                        {t.anteriores} → <strong className="text-texto">{t.recientes}</strong> reportes
                      </span>
                      <Insignia
                        tono={estilo.tono}
                        texto={`${estilo.flecha} ${estilo.texto}${t.cambio !== null && t.tendencia !== 'estable' ? ` ${Math.abs(t.cambio)} %` : ''}`}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-texto-suave">Aún no hay salas.</p>
          )}
        </BloquePanel>

        <BloquePanel titulo="Fallas más seguidas · menor tiempo medio entre fallas">
          {conMtbf.length ? (
            <ol className="divide-y divide-borde text-sm">
              {conMtbf.slice(0, 8).map((e) => (
                <li key={e.codigo} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <Link href={`/soporte/equipos/${encodeURIComponent(e.codigo)}`} className="font-medium text-primario underline-offset-4 hover:underline">
                    {e.codigo} <span className="font-normal text-texto-suave">· {e.sala}</span>
                  </Link>
                  <span className="flex items-center gap-1.5 text-texto-suave">
                    <Icono nombre="reloj" className="size-3.5" />
                    falla cada {textoDias(e.mtbf)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-texto-suave">
              Se necesita al menos un equipo con dos fallas en los últimos {DIAS_MTBF} días para calcular el MTBF.
            </p>
          )}
        </BloquePanel>
      </div>
    </>
  );
}
