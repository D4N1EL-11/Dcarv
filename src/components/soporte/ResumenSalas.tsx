import Link from 'next/link';
import type { FilaSala } from '@/lib/dataService';
import { plural, porcentaje } from '@/lib/formato';
import { BarraDisponibilidad } from './BarraDisponibilidad';

type Props = {
  salas: FilaSala[];
  seleccionada?: string | undefined;
  // En /soporte/salas cada tarjeta ofrece además registrar un equipo en esa sala.
  conRegistro?: boolean | undefined;
};

export function ResumenSalas({ salas, seleccionada, conRegistro = false }: Props) {
  return (
    <ul aria-label="Resumen por sala" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {salas.map((sala) => {
        const activa = sala.id === seleccionada;
        return (
          <li
            key={sala.id}
            className={`relative grid gap-2 rounded-lg border bg-superficie p-4 transition hover:border-primario ${activa ? 'border-primario ring-2 ring-primario/30' : 'border-borde'}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold">
                {/* Enlace extendido: toda la tarjeta filtra el panel por esta sala. */}
                <Link
                  href={activa ? '/soporte' : `/soporte?salaId=${sala.id}`}
                  aria-current={activa ? 'true' : undefined}
                  className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-2 focus-visible:outline-primario"
                >
                  {sala.nombre}
                  <span className="sr-only">
                    {activa ? ' (filtro activo, pulse para quitarlo)' : ': ver sus equipos'}
                  </span>
                </Link>
              </h3>
              <span className="text-sm text-texto-suave">
                {plural(sala.totalEquipos, 'equipo', 'equipos')}
              </span>
            </div>

            <p className="text-sm text-texto-suave">
              <span className="text-2xl font-bold text-funcional">{sala.funcionales}</span>{' '}
              {sala.funcionales === 1 ? 'disponible' : 'disponibles'}
              {sala.totalEquipos ? ` · ${porcentaje(sala.funcionales, sala.totalEquipos)} %` : ''}
            </p>

            <BarraDisponibilidad
              funcionales={sala.funcionales}
              enReparacion={sala.enReparacion}
              dadosDeBaja={sala.dadosDeBaja}
            />

            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
              <div className="flex gap-1">
                <dt>En reparación:</dt>
                <dd className="font-semibold text-[#8a5a12]">{sala.enReparacion}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Dados de baja:</dt>
                <dd className="font-semibold text-baja">{sala.dadosDeBaja}</dd>
              </div>
            </dl>

            {conRegistro ? (
              <Link
                href={`/soporte/equipos/nuevo?salaId=${sala.id}`}
                className="relative z-10 justify-self-start text-sm font-semibold text-primario underline"
              >
                Registrar equipos aquí
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
