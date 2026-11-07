import type { Metadata } from 'next';
import { ControlesMonitor } from '@/components/monitor/ControlesMonitor';
import { BarraDisponibilidad } from '@/components/soporte/BarraDisponibilidad';
import { InsigniaEstadoIncidencia } from '@/components/soporte/InsigniaEstadoIncidencia';
import { InsigniaPrioridad } from '@/components/soporte/InsigniasClasificacion';
import { InsigniaSla } from '@/components/soporte/InsigniaSla';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { soloSoporte } from '@/lib/auth/sesion';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import { contarIncidenciasPorEstado, incidenciasPendientes, listarSalas } from '@/lib/dataService';
import { formatearFechaLarga, plural, porcentaje } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';
import { evaluarSla } from '@/lib/reglas/sla';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monitor · Soporte de Salas',
  robots: { index: false, follow: false },
};

// Casos que caben en la lista de una pantalla grande sin desplazarse.
const CASOS_EN_PANTALLA = 9;
// Para contar los vencidos se miran todos los pendientes, no solo los de la lista.
const LIMITE_PENDIENTES = 500;

function CifraMonitor({
  titulo,
  valor,
  detalle,
  icono,
  alerta = false,
}: {
  titulo: string;
  valor: number | string;
  detalle: string;
  icono: NombreIcono;
  alerta?: boolean;
}) {
  return (
    <div className={`grid content-start gap-2 rounded-2xl border p-5 2xl:p-6 ${alerta ? 'border-baja/50 bg-baja/10' : 'border-borde bg-superficie'}`}>
      <span className="flex items-center justify-between gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-texto-suave">
        {titulo}
        <Icono nombre={icono} className={`size-5 ${alerta ? 'text-baja' : 'text-primario'}`} />
      </span>
      <span className={`text-5xl font-semibold leading-none tabular-nums 2xl:text-6xl ${alerta ? 'text-baja' : 'text-texto'}`}>{valor}</span>
      <span className="text-sm text-texto-suave">{detalle}</span>
    </div>
  );
}

// Pantalla para la oficina de soporte (un televisor o un segundo monitor): cifras grandes, lo que
// requiere atención y el estado de cada sala. Sin menú; se actualiza sola.
export default async function Monitor() {
  await soloSoporte();
  const [salas, conteo, pendientes, candidatos] = await Promise.all([
    listarSalas(),
    contarIncidenciasPorEstado(),
    incidenciasPendientes(LIMITE_PENDIENTES),
    candidatosDeLaPeticion(),
  ]);
  const ahora = new Date();
  const totalEquipos = salas.reduce((s, x) => s + x.totalEquipos, 0);
  const funcionales = salas.reduce((s, x) => s + x.funcionales, 0);
  const enReparacion = salas.reduce((s, x) => s + x.enReparacion, 0);
  const vencidos = pendientes.filas.filter((i) => evaluarSla(i, ahora).estado === 'vencido').length;

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-fondo px-[clamp(1rem,2.5vw,3rem)] py-6 text-texto">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-full border border-primario/50 font-titulo text-2xl font-semibold text-primario">
            D
          </span>
          <div>
            <h1 className="text-3xl font-medium leading-none sm:text-4xl">Soporte de Salas</h1>
            <p className="mt-1 text-sm capitalize text-texto-suave">{formatearFechaLarga(hoyBogota())}</p>
          </div>
        </div>
        <ControlesMonitor generado={ahora.toISOString()} />
      </header>
      <div aria-hidden="true" className="linea-dorada" />

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <CifraMonitor
          titulo="Disponibles"
          valor={`${porcentaje(funcionales, totalEquipos)} %`}
          detalle={`${funcionales} de ${plural(totalEquipos, 'equipo', 'equipos')}`}
          icono="equipo"
        />
        <CifraMonitor titulo="En reparación" valor={enReparacion} detalle="equipos fuera de servicio" icono="tecnicos" />
        <CifraMonitor titulo="Abiertos" valor={conteo.abierta} detalle="casos sin técnico" icono="incidencias" alerta={conteo.abierta > 0} />
        <CifraMonitor titulo="En revisión" valor={conteo.en_revision} detalle="casos en atención" icono="reloj" />
        <CifraMonitor
          titulo="Fuera de tiempo"
          valor={vencidos}
          detalle={candidatos.length ? `${plural(candidatos.length, 'candidato', 'candidatos')} a baja` : 'casos que pasaron su meta'}
          icono="alertas"
          alerta={vencidos > 0}
        />
      </section>

      <div className="grid flex-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="titulo-atencion" className="grid gap-4 rounded-2xl border border-borde bg-superficie p-5 2xl:p-6">
          <h2 id="titulo-atencion" className="flex items-baseline justify-between gap-3 text-2xl font-medium">
            Requiere atención
            <span className="font-sans text-sm font-normal text-texto-suave">{plural(pendientes.total, 'pendiente', 'pendientes')}</span>
          </h2>
          {pendientes.filas.length ? (
            <ol className="divide-y divide-borde">
              {pendientes.filas.slice(0, CASOS_EN_PANTALLA).map((caso) => (
                <li key={caso.numeroCaso} className="grid gap-2 py-3 first:pt-0 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-semibold tabular-nums">{caso.numeroCaso}</span>
                    <InsigniaEstadoIncidencia estado={caso.estado} />
                  </span>
                  <span className="min-w-0 truncate text-texto-suave">
                    <span className="font-semibold text-primario">{caso.equipoCodigo}</span> · {caso.descripcion}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {caso.prioridad === 'alta' ? <InsigniaPrioridad prioridad="alta" /> : null}
                    <InsigniaSla caso={caso} ahora={ahora} />
                    <span className="text-sm text-texto-suave">{caso.tecnico ?? 'Sin técnico'}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="flex items-center gap-3 text-lg text-texto-suave">
              <span className="grid size-10 place-items-center rounded-full bg-funcional/15 text-funcional">
                <Icono nombre="check" className="size-5" />
              </span>
              Todo al día: no hay casos pendientes.
            </p>
          )}
        </section>

        <section aria-labelledby="titulo-salas-monitor" className="grid gap-4 rounded-2xl border border-borde bg-superficie p-5 2xl:p-6">
          <h2 id="titulo-salas-monitor" className="text-2xl font-medium">
            Salas
          </h2>
          <ul className="grid gap-4">
            {salas.map((sala) => (
              <li key={sala.id} className="grid gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-lg font-semibold">{sala.nombre}</span>
                  <span className="text-sm tabular-nums text-texto-suave">
                    <span className="text-xl font-semibold text-texto">{sala.funcionales}</span>/{sala.totalEquipos} ·{' '}
                    {porcentaje(sala.funcionales, sala.totalEquipos)} %
                  </span>
                </div>
                <div className="[&>div]:h-2">
                  <BarraDisponibilidad
                    funcionales={sala.funcionales}
                    enReparacion={sala.enReparacion}
                    dadosDeBaja={sala.dadosDeBaja}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
