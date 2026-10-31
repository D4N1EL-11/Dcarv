import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { FilaCandidato } from '@/lib/dataService';

export function PanelAlertas({ candidatos }: { candidatos: FilaCandidato[] }) {
  if (!candidatos.length) return <EstadoVacio titulo="No hay equipos candidatos a baja" />;
  return (
    <ul className="grid gap-2">
      {candidatos.map((candidato) => (
        <li key={candidato.codigo}>
          <Tarjeta className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/soporte/equipos/${encodeURIComponent(candidato.codigo)}`}
                className="font-semibold text-primario underline"
              >
                {candidato.codigo}
              </Link>
              <p className="text-sm text-texto-suave">{candidato.sala}</p>
            </div>
            <span className="text-sm font-semibold">
              {candidato.incidencias30d} incidencias en 30 días
            </span>
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}
