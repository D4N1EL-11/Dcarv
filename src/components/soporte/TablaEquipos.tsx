import Link from 'next/link';
import type { FilaEquipo } from '@/lib/dataService';
import { InsigniaEstadoEquipo } from './InsigniaEstadoEquipo';
import { SelectorEstadoEquipo } from './SelectorEstadoEquipo';

const CELDA =
  'flex items-center justify-between gap-4 px-4 py-2 sm:table-cell sm:border-t sm:border-borde';

function Dato({ titulo }: { titulo: string }) {
  return <span className="text-xs font-semibold text-texto-suave sm:hidden">{titulo}</span>;
}

// Bajo 640 px cada fila se apila como una tarjeta (sección 13 del plan).
export function TablaEquipos({ equipos }: { equipos: FilaEquipo[] }) {
  return (
    <table className="block w-full text-sm sm:table sm:rounded-lg sm:border sm:border-borde sm:bg-superficie">
      <thead className="hidden text-left text-texto-suave sm:table-header-group">
        <tr>
          <th className="px-4 py-2 font-semibold">Código</th>
          <th className="px-4 py-2 font-semibold">Sala</th>
          <th className="px-4 py-2 font-semibold">Estado</th>
          <th className="px-4 py-2 font-semibold">Cambiar estado</th>
        </tr>
      </thead>
      <tbody className="grid gap-3 sm:table-row-group">
        {equipos.map((equipo) => (
          <tr
            key={equipo.codigo}
            className="block rounded-lg border border-borde bg-superficie sm:table-row sm:border-0"
          >
            <td className={CELDA}>
              <Dato titulo="Código" />
              <Link
                href={`/soporte/equipos/${encodeURIComponent(equipo.codigo)}`}
                className="font-semibold text-primario underline"
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
              <Dato titulo="Cambiar estado" />
              <SelectorEstadoEquipo codigo={equipo.codigo} estado={equipo.estado} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
