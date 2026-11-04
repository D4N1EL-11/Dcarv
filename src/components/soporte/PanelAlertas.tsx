import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { FilaCandidato } from '@/lib/dataService';
import { InsigniaEstadoEquipo } from './InsigniaEstadoEquipo';
import { SelectorEstadoEquipo } from './SelectorEstadoEquipo';

// Cada candidato se puede revisar (historial) o dar de baja aquí mismo, con confirmación.
export function PanelAlertas({ candidatos }: { candidatos: FilaCandidato[] }) {
  if (!candidatos.length) {
    return (
      <EstadoVacio titulo="No hay equipos candidatos a baja">
        Ningún equipo en servicio acumula fallas repetidas en este momento.
      </EstadoVacio>
    );
  }
  return (
    <ul className="grid gap-3">
      {candidatos.map((candidato) => (
        <li key={candidato.codigo}>
          <Tarjeta className="grid gap-3 border-l-4 border-l-baja sm:grid-cols-[1fr_auto_14rem] sm:items-center">
            <div className="grid gap-1">
              <Link
                href={`/soporte/equipos/${encodeURIComponent(candidato.codigo)}`}
                className="font-semibold break-all text-primario underline"
              >
                {candidato.codigo}
              </Link>
              <p className="text-sm text-texto-suave">Sala: {candidato.sala}</p>
              <div>
                <InsigniaEstadoEquipo estado={candidato.estado} />
              </div>
            </div>
            <p className="text-sm">
              <span className="text-2xl font-bold text-baja">{candidato.incidencias30d}</span>{' '}
              {candidato.incidencias30d === 1 ? 'incidencia' : 'incidencias'} en 30 días
            </p>
            <div className="grid gap-1">
              <span className="text-xs font-semibold text-texto-suave">Cambiar estado</span>
              <SelectorEstadoEquipo codigo={candidato.codigo} estado={candidato.estado} />
            </div>
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}
