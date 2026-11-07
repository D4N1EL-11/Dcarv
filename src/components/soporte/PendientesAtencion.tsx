import Link from 'next/link';
import { Icono } from '@/components/ui/Icono';
import { DIAS_REASIGNACION } from '@/lib/config/soporte';
import type { FilaIncidencia } from '@/lib/dataService';
import { plural, textoAntiguedad } from '@/lib/formato';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';
import { InsigniaEstadoIncidencia } from './InsigniaEstadoIncidencia';
import { InsigniaPrioridad } from './InsigniasClasificacion';
import { InsigniaSla } from './InsigniaSla';

type Props = { incidencias: FilaIncidencia[]; total: number };

// Lista de trabajo del panel: lo pendiente, primero la prioridad alta y, dentro de cada prioridad,
// de lo que más espera a lo más reciente.
export function PendientesAtencion({ incidencias, total }: Props) {
  if (!incidencias.length) {
    return (
      <p className="flex items-center gap-3 text-sm text-texto-suave">
        <span className="grid size-8 place-items-center rounded-full bg-funcional/15 text-funcional">
          <Icono nombre="check" />
        </span>
        Todo al día: no hay incidencias abiertas ni en revisión.
      </p>
    );
  }
  const hoy = hoyBogota();
  return (
    <div className="grid gap-3">
      <ol className="divide-y divide-borde">
        {incidencias.map((incidencia) => {
          const dias = diasEntre(incidencia.fecha, hoy);
          const atrasada = dias > DIAS_REASIGNACION;
          return (
            <li key={incidencia.numeroCaso}>
              <Link
                href={`/soporte/incidencias/${encodeURIComponent(incidencia.numeroCaso)}`}
                className="group grid gap-x-4 gap-y-1 py-3 transition first:pt-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-texto group-hover:text-primario">{incidencia.numeroCaso}</span>
                  <InsigniaEstadoIncidencia estado={incidencia.estado} />
                  {incidencia.prioridad === 'alta' ? <InsigniaPrioridad prioridad="alta" /> : null}
                  <InsigniaSla caso={incidencia} />
                </span>
                <span className="min-w-0 truncate text-sm text-texto-suave">
                  <span className="font-medium text-primario">{incidencia.equipoCodigo}</span> · {incidencia.descripcion}
                </span>
                <span className={`flex items-center gap-1.5 text-xs sm:justify-end ${atrasada ? 'text-baja' : 'text-texto-suave'}`}>
                  <Icono nombre="reloj" className="size-3.5" />
                  reportada {textoAntiguedad(dias)}
                  {incidencia.tecnico ? ` · ${incidencia.tecnico}` : ' · sin técnico'}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link
        href="/soporte/incidencias"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primario underline-offset-4 hover:underline"
      >
        {total > incidencias.length ? `Ver las ${plural(total, 'pendiente', 'pendientes')}` : 'Ir a incidencias'}
        <Icono nombre="flecha" className="size-3.5" />
      </Link>
    </div>
  );
}
