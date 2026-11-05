import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { FilaIncidencia, FilaTecnico } from '@/lib/dataService';
import { formatearFecha, plural, textoAntiguedad } from '@/lib/formato';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';
import { diasHastaReasignacion } from '@/lib/reglas/tecnico';
import { AccionesIncidencia } from './AccionesIncidencia';
import { InsigniaEstadoIncidencia } from './InsigniaEstadoIncidencia';

type Props = {
  incidencias: FilaIncidencia[];
  tecnicos: FilaTecnico[];
  mostrarEquipo?: boolean;
  textoVacio: string;
};

// RN-10 visible: cuánto lleva el caso con su técnico y cuándo lo tomará la reasignación automática.
function TextoRevision({ diaEstado, hoy }: { diaEstado: string; hoy: string }) {
  const transcurridos = diasEntre(diaEstado, hoy);
  const faltan = diasHastaReasignacion(transcurridos);
  return (
    <p className="text-xs text-texto-suave">
      Con este técnico desde {textoAntiguedad(transcurridos)}
      {' · '}
      {faltan > 0
        ? `pasa a otro técnico en ${plural(faltan, 'día', 'días')} si no se cierra`
        : 'entra en la próxima reasignación automática'}
    </p>
  );
}

export function HistorialIncidencias({ incidencias, tecnicos, mostrarEquipo, textoVacio }: Props) {
  if (!incidencias.length) return <EstadoVacio titulo={textoVacio} />;
  const activos = tecnicos.filter((t) => t.activo).map(({ id, nombre }) => ({ id, nombre }));
  const hoy = hoyBogota();
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
                  {incidencia.estado !== 'cerrada'
                    ? ` · reportada ${textoAntiguedad(diasEntre(incidencia.fecha, hoy))}`
                    : ''}
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
              <p className="text-sm whitespace-pre-line break-words">{incidencia.descripcion}</p>
              {incidencia.tecnico ? (
                <p className="text-sm text-texto-suave">Técnico: {incidencia.tecnico}</p>
              ) : null}
              {incidencia.estado === 'en_revision' && incidencia.tecnico ? (
                <TextoRevision diaEstado={incidencia.diaEstado} hoy={hoy} />
              ) : null}
            </div>
            <div className="sm:w-48 sm:shrink-0">
              <AccionesIncidencia
                numeroCaso={incidencia.numeroCaso}
                estado={incidencia.estado}
                equipoCodigo={incidencia.equipoCodigo}
                estadoEquipo={incidencia.estadoEquipo}
                otrasPendientes={incidencia.otrasPendientes}
                tecnicos={activos}
              />
            </div>
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}
