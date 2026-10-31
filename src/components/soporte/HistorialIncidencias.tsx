import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { FilaIncidencia, FilaTecnico } from '@/lib/dataService';
import { formatearFecha } from '@/lib/formato';
import { AccionesIncidencia } from './AccionesIncidencia';
import { InsigniaEstadoIncidencia } from './InsigniaEstadoIncidencia';

type Props = {
  incidencias: FilaIncidencia[];
  tecnicos: FilaTecnico[];
  mostrarEquipo?: boolean;
  textoVacio: string;
};

export function HistorialIncidencias({ incidencias, tecnicos, mostrarEquipo, textoVacio }: Props) {
  if (!incidencias.length) return <EstadoVacio titulo={textoVacio} />;
  const activos = tecnicos.filter((t) => t.activo).map(({ id, nombre }) => ({ id, nombre }));
  return (
    <ul className="grid gap-3">
      {incidencias.map((incidencia) => (
        <li key={incidencia.numeroCaso}>
          <Tarjeta className="flex flex-col justify-between gap-3 sm:flex-row">
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{incidencia.numeroCaso}</span>
                <InsigniaEstadoIncidencia estado={incidencia.estado} />
                <span className="text-sm text-texto-suave">
                  {formatearFecha(incidencia.fecha)}
                </span>
              </div>
              {mostrarEquipo ? (
                <Link
                  href={`/soporte/equipos/${encodeURIComponent(incidencia.equipoCodigo)}`}
                  className="text-sm font-semibold text-primario underline"
                >
                  {incidencia.equipoCodigo}
                </Link>
              ) : null}
              <p className="text-sm">{incidencia.descripcion}</p>
              {incidencia.tecnico ? (
                <p className="text-sm text-texto-suave">Técnico: {incidencia.tecnico}</p>
              ) : null}
            </div>
            <div className="sm:w-48 sm:shrink-0">
              <AccionesIncidencia
                numeroCaso={incidencia.numeroCaso}
                estado={incidencia.estado}
                tecnicos={activos}
              />
            </div>
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}
