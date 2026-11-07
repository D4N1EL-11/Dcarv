import type { Metadata } from 'next';
import Link from 'next/link';
import { BarrasHorizontales } from '@/components/soporte/BarrasHorizontales';
import { Estrellas } from '@/components/soporte/CalificacionCaso';
import { BotonImprimir } from '@/components/ui/BotonImprimir';
import { BloquePanel, EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { Cifra } from '@/components/ui/Cifra';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono } from '@/components/ui/Icono';
import { soloSoporte } from '@/lib/auth/sesion';
import { CATEGORIAS_INCIDENCIA, DIAS_REASIGNACION, META_HORAS_PRIORIDAD, PRIORIDADES_INCIDENCIA } from '@/lib/config/soporte';
import { informeMensual, primerMesConDatos } from '@/lib/dataService';
import { formatearFecha, plural, textoPromedioDias } from '@/lib/formato';
import { AYUDA_CATEGORIA, AYUDA_PRIORIDAD, ETIQUETA_CATEGORIA, ETIQUETA_PRIORIDAD } from '@/lib/reglas/clasificacion';
import { hoyBogota } from '@/lib/reglas/fechas';
import { textoHoras } from '@/lib/reglas/sla';
import {
  compararMeses,
  mesDe,
  nombreMes,
  normalizarMes,
  proporcion,
  sumarMeses,
  textoMes,
  textoVariacion,
} from '@/lib/reglas/informe';

export const metadata: Metadata = { title: 'Informe mensual' };

type Props = { searchParams: Promise<{ mes?: string | string[] }> };

function primeraMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function EnlaceMes({ href, children, etiqueta }: { href: string | null; children: React.ReactNode; etiqueta: string }) {
  const clases = 'inline-flex items-center gap-1.5 rounded-lg border border-borde px-3 py-1.5 text-sm transition';
  if (!href) {
    return (
      <span aria-disabled="true" className={`${clases} cursor-not-allowed text-texto-suave/50`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={etiqueta} className={`${clases} text-texto hover:border-primario/60 hover:text-primario`}>
      {children}
    </Link>
  );
}

// Informe mensual para la coordinación: casos, tiempos de cierre, lo que más falla en cada sala,
// el trabajo de cada técnico, bajas y mantenimientos. Se imprime o se guarda como PDF desde el
// navegador (estilos de impresión en blanco).
export default async function PaginaInforme({ searchParams }: Props) {
  await soloSoporte();
  const hoy = hoyBogota();
  const primero = await primerMesConDatos();
  const mes = normalizarMes((await searchParams).mes, hoy, primero);
  const informe = await informeMensual(mes);
  const { resumen, anterior } = informe;

  const actual = mesDe(hoy);
  const enCurso = compararMeses(mes, actual) === 0;
  const previo = sumarMeses(mes, -1);
  const siguiente = sumarMeses(mes, 1);
  const hayPrevio = primero ? compararMeses(previo, primero) >= 0 : false;
  const haySiguiente = compararMeses(siguiente, actual) <= 0;
  const anteriorTieneDatos = hayPrevio;
  const aTiempo = proporcion(resumen.cerradasATiempo, resumen.cerradas);
  const titulo = primeraMayuscula(nombreMes(mes));
  const sinCasos = resumen.reportadas === 0 && resumen.cerradas === 0;

  return (
    <>
      <EncabezadoPagina
        etiqueta={enCurso ? `Informe mensual · en curso, hasta hoy ${formatearFecha(hoy)}` : 'Informe mensual'}
        titulo={titulo}
        descripcion={`Del ${formatearFecha(informe.desde)} al ${formatearFecha(informe.hasta)}. Un caso cuenta en el mes en que se reportó y su cierre, en el mes en que se cerró (fechas de Colombia).`}
      >
        <BotonImprimir texto="Imprimir o guardar PDF" />
      </EncabezadoPagina>

      <nav aria-label="Cambiar de mes" className="flex flex-wrap items-center gap-2 print:hidden">
        <EnlaceMes href={hayPrevio ? `/soporte/informe?mes=${textoMes(previo)}` : null} etiqueta={`Ver ${nombreMes(previo)}`}>
          <Icono nombre="izquierda" className="size-3.5" /> {primeraMayuscula(nombreMes(previo))}
        </EnlaceMes>
        <EnlaceMes href={haySiguiente ? `/soporte/informe?mes=${textoMes(siguiente)}` : null} etiqueta={`Ver ${nombreMes(siguiente)}`}>
          {primeraMayuscula(nombreMes(siguiente))} <Icono nombre="derecha" className="size-3.5" />
        </EnlaceMes>
        {!enCurso ? (
          <Link href="/soporte/informe" className="px-2 text-sm text-texto-suave underline-offset-4 hover:text-primario hover:underline">
            Ir al mes actual
          </Link>
        ) : null}
      </nav>
      <p className="hidden text-xs print:block">
        Soporte de Salas · Informe de {nombreMes(mes)} · generado el {formatearFecha(hoy)}
      </p>

      <section aria-label="Resumen del mes" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Cifra
          titulo="Reportados"
          valor={resumen.reportadas}
          detalle={textoVariacion(resumen.reportadas, anteriorTieneDatos ? anterior.reportadas : null) ?? 'casos nuevos'}
          icono="incidencias"
          color="text-reparacion"
        />
        <Cifra
          titulo="Cerrados"
          valor={resumen.cerradas}
          detalle={textoVariacion(resumen.cerradas, anteriorTieneDatos ? anterior.cerradas : null) ?? 'casos resueltos'}
          icono="check"
          color="text-funcional"
        />
        <Cifra titulo="Tiempo de cierre" valor={textoPromedioDias(resumen.promedioDias)} detalle="promedio, del reporte al cierre" icono="reloj" />
        <Cifra
          titulo="A tiempo"
          valor={aTiempo === null ? '—' : `${aTiempo} %`}
          detalle={`cerrados en ${DIAS_REASIGNACION} días o menos`}
          icono="escudo"
          color="text-revision"
        />
        <Cifra
          titulo="Pendientes"
          valor={resumen.pendientesAlCierre}
          detalle={enCurso ? 'sin cerrar hoy' : 'sin cerrar al terminar el mes'}
          icono="alertas"
          color="text-baja"
        />
      </section>

      {sinCasos ? (
        <EstadoVacio titulo={`No hubo casos en ${nombreMes(mes)}`} icono="informe">
          Elija otro mes con las flechas.
        </EstadoVacio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <BloquePanel titulo="Qué falla más · casos reportados por categoría">
            <BarrasHorizontales
              titulo="Casos reportados por categoría"
              unidad={['caso', 'casos']}
              filas={CATEGORIAS_INCIDENCIA.map((c) => ({
                clave: c,
                etiqueta: ETIQUETA_CATEGORIA[c],
                valor: informe.porCategoria[c],
                ayuda: AYUDA_CATEGORIA[c],
              }))}
            />
          </BloquePanel>
          <BloquePanel titulo="Prioridad de los casos reportados">
            <BarrasHorizontales
              titulo="Casos reportados por prioridad"
              unidad={['caso', 'casos']}
              ordenar={false}
              filas={PRIORIDADES_INCIDENCIA.map((p) => ({
                clave: p,
                etiqueta: ETIQUETA_PRIORIDAD[p],
                valor: informe.porPrioridad[p],
                ayuda: AYUDA_PRIORIDAD[p],
              }))}
            />
          </BloquePanel>
        </div>
      )}

      <section aria-labelledby="titulo-salas" className="grid gap-4 print:break-inside-avoid">
        <TituloSeccion id="titulo-salas" titulo="Por sala" />
        <div className="overflow-x-auto rounded-xl border border-borde bg-superficie">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-[0.7rem] uppercase tracking-[0.18em] text-texto-suave">
                <th scope="col" className="px-5 py-3 font-medium">Sala</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Equipos</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Reportados</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Cerrados</th>
                <th scope="col" className="px-5 py-3 font-medium">Lo que más falla</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {informe.porSala.map((s) => (
                <tr key={s.salaId}>
                  <th scope="row" className="px-5 py-3 text-left font-medium text-texto">{s.sala}</th>
                  <td className="px-5 py-3 text-right tabular-nums">{s.equipos}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{s.reportadas}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{s.cerradas}</td>
                  <td className="px-5 py-3 text-texto-suave">
                    {s.masFrecuente ? `${ETIQUETA_CATEGORIA[s.masFrecuente.categoria]} (${s.masFrecuente.total})` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="titulo-sla" className="grid gap-4">
        <TituloSeccion id="titulo-sla" titulo="Tiempos de atención">
          <p className="text-sm text-texto-suave">
            Horas entre el reporte y el cierre frente a la meta de cada prioridad (alta {META_HORAS_PRIORIDAD.alta} h,
            media {META_HORAS_PRIORIDAD.media} h, baja {META_HORAS_PRIORIDAD.baja} h).
          </p>
        </TituloSeccion>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {informe.sla.map((fila) => (
            <Cifra
              key={fila.prioridad}
              titulo={`Prioridad ${ETIQUETA_PRIORIDAD[fila.prioridad].toLowerCase()}`}
              valor={fila.cerradas ? `${Math.round((fila.dentroDeMeta / fila.cerradas) * 100)} %` : '—'}
              detalle={
                fila.cerradas
                  ? `${fila.dentroDeMeta} de ${plural(fila.cerradas, 'cierre', 'cierres')} dentro de la meta · promedio ${textoHoras(fila.promedioHoras ?? 0)}`
                  : 'Sin cierres este mes'
              }
              icono="reloj"
              color={fila.cerradas && fila.dentroDeMeta < fila.cerradas ? 'text-reparacion' : 'text-funcional'}
            />
          ))}
        </div>
      </section>

      <BloquePanel titulo="Satisfacción · calificaciones de quienes reportaron">
        {informe.satisfaccion.total ? (
          <div className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="grid justify-items-start gap-2">
              <span className="text-5xl font-semibold leading-none tabular-nums text-texto">
                {informe.satisfaccion.promedio!.toFixed(1).replace('.', ',')}
                <span className="text-xl text-texto-suave"> / 5</span>
              </span>
              <Estrellas valor={Math.round(informe.satisfaccion.promedio!)} className="size-5" />
              <span className="text-xs text-texto-suave">{plural(informe.satisfaccion.total, 'calificación', 'calificaciones')}</span>
            </div>
            <BarrasHorizontales
              titulo="Calificaciones por número de estrellas"
              unidad={['calificación', 'calificaciones']}
              ordenar={false}
              filas={[5, 4, 3, 2, 1].map((n) => ({
                clave: String(n),
                etiqueta: `${n} ${n === 1 ? 'estrella' : 'estrellas'}`,
                valor: informe.satisfaccion.porEstrellas[n - 1] ?? 0,
              }))}
            />
          </div>
        ) : (
          <p className="text-sm text-texto-suave">Nadie calificó la atención este mes.</p>
        )}
      </BloquePanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <BloquePanel titulo="Técnicos · casos cerrados en el mes">
          {informe.porTecnico.length ? (
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Técnico</th>
                  <th scope="col">Cerrados</th>
                  <th scope="col">Tiempo medio</th>
                  <th scope="col">Dentro de la meta</th>
                  <th scope="col">Calificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {informe.porTecnico.map((t) => (
                  <tr key={t.tecnico}>
                    <th scope="row" className="py-2 text-left font-medium text-texto">{t.tecnico}</th>
                    <td className="py-2 text-right tabular-nums">{plural(t.cerradas, 'caso', 'casos')}</td>
                    <td className="py-2 pl-4 text-right text-texto-suave">{textoPromedioDias(t.promedioDias)}</td>
                    <td className="py-2 pl-4 text-right tabular-nums text-texto-suave" title="Cierres dentro de la meta de su prioridad">
                      {Math.round((t.dentroDeMeta / t.cerradas) * 100)} % a tiempo
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums text-texto-suave" title={plural(t.calificaciones, 'calificación', 'calificaciones')}>
                      {t.promedioEstrellas !== null ? `★ ${t.promedioEstrellas.toFixed(1).replace('.', ',')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-texto-suave">Ningún técnico cerró casos este mes.</p>
          )}
        </BloquePanel>

        <BloquePanel titulo="Equipos con más fallas en el mes">
          {informe.equiposConMasFallas.length ? (
            <ol className="divide-y divide-borde text-sm">
              {informe.equiposConMasFallas.map((e) => (
                <li key={e.codigo} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/soporte/equipos/${encodeURIComponent(e.codigo)}`}
                    className="font-medium text-primario underline-offset-4 hover:underline print:text-texto"
                  >
                    {e.codigo}
                  </Link>
                  <span className="text-texto-suave">{e.sala}</span>
                  <span className="ml-auto tabular-nums text-texto">{plural(e.fallas, 'falla', 'fallas')}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-texto-suave">Ningún equipo tuvo más de una falla este mes.</p>
          )}
        </BloquePanel>

        <BloquePanel titulo="Equipos dados de baja">
          {informe.bajas.length ? (
            <ol className="divide-y divide-borde text-sm">
              {informe.bajas.map((b) => (
                <li key={`${b.codigo}-${b.dia}`} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span className="font-medium text-texto">{b.codigo}</span>
                  <span className="text-texto-suave">
                    {formatearFecha(b.dia)} · {b.actor === 'sistema' ? 'El sistema' : b.actor}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-texto-suave">No se dio de baja ningún equipo este mes.</p>
          )}
        </BloquePanel>

        <BloquePanel titulo="Mantenimientos realizados">
          {informe.mantenimientos.length ? (
            <ol className="divide-y divide-borde text-sm">
              {informe.mantenimientos.map((m) => (
                <li key={m.id} className="grid gap-0.5 py-2">
                  <span className="flex flex-wrap justify-between gap-3">
                    <span className="font-medium text-texto">{m.sala}</span>
                    <span className="tabular-nums text-texto-suave">{formatearFecha(m.fecha)}</span>
                  </span>
                  {m.notas ? <span className="text-xs text-texto-suave">{m.notas}</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-texto-suave">
              No se registraron mantenimientos este mes.{' '}
              <Link href="/soporte/mantenimiento" className="text-primario underline-offset-4 hover:underline print:hidden">
                Ir a mantenimiento
              </Link>
            </p>
          )}
        </BloquePanel>
      </div>
    </>
  );
}
