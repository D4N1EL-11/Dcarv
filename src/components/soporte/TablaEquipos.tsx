import Link from 'next/link';
import { Insignia } from '@/components/ui/Insignia';
import type { FilaEquipo } from '@/lib/dataService';
import { esCandidatoABaja } from '@/lib/reglas/alertas';
import { InsigniaEstadoEquipo } from './InsigniaEstadoEquipo';
import { SelectorEstadoEquipo } from './SelectorEstadoEquipo';

const CELDA =
  'flex items-center justify-between gap-4 px-4 py-2.5 sm:table-cell sm:border-t sm:border-borde sm:px-5 sm:py-3 sm:align-middle';

function Dato({ titulo }: { titulo: string }) {
  return <span className="text-xs uppercase tracking-wider text-texto-suave sm:hidden">{titulo}</span>;
}

// Bajo 640 px cada fila se apila como una tarjeta (sección 13 del plan).
export function TablaEquipos({ equipos }: { equipos: FilaEquipo[] }) {
  return (
    <table className="block w-full text-sm sm:table sm:overflow-hidden sm:rounded-xl sm:border sm:border-borde sm:bg-superficie">
      <caption className="sr-only">Equipos registrados</caption>
      <thead className="hidden text-left text-[0.7rem] uppercase tracking-[0.15em] text-texto-suave sm:table-header-group">
        <tr>
          <th scope="col" className="px-5 py-3 font-medium">Código</th>
          <th scope="col" className="px-5 py-3 font-medium">Sala</th>
          <th scope="col" className="px-5 py-3 font-medium">Estado</th>
          <th scope="col" className="px-5 py-3 font-medium">Incidencias (30 días)</th>
          <th scope="col" className="px-5 py-3 font-medium">Cambiar estado</th>
        </tr>
      </thead>
      <tbody className="grid gap-3 sm:table-row-group">
        {equipos.map((equipo) => {
          const candidato =
            equipo.estado !== 'dado_de_baja' && esCandidatoABaja(equipo.incidencias30d);
          return (
            <tr
              key={equipo.codigo}
              className="block rounded-xl border border-borde bg-superficie py-1 transition-colors sm:table-row sm:border-0 sm:py-0 sm:hover:bg-primario-suave"
            >
              <td className={CELDA}>
                <Dato titulo="Código" />
                <Link
                  href={`/soporte/equipos/${encodeURIComponent(equipo.codigo)}`}
                  className="font-medium break-all text-primario underline-offset-4 hover:underline"
                >
                  {equipo.codigo}
                </Link>
              </td>
              <td className={CELDA}>
                <Dato titulo="Sala" />
                {equipo.sala}
              </td>
              <td className={CELDA}>
                <Dato titulo="Estado" />
                <InsigniaEstadoEquipo estado={equipo.estado} />
              </td>
              <td className={CELDA}>
                <Dato titulo="Incidencias (30 días)" />
                <span className="flex flex-wrap items-center gap-2">
                  <span className={candidato ? 'font-bold' : ''}>{equipo.incidencias30d}</span>
                  {candidato ? <Insignia tono="baja" texto="Candidato a baja" /> : null}
                </span>
              </td>
              <td className={CELDA}>
                <Dato titulo="Cambiar estado" />
                <SelectorEstadoEquipo codigo={equipo.codigo} estado={equipo.estado} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
