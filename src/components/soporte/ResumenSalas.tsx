import Link from 'next/link';
import type { FilaSala } from '@/lib/dataService';
import { plural, porcentaje } from '@/lib/formato';
import { AccionesSala } from './AccionesSala';
import { BarraDisponibilidad } from './BarraDisponibilidad';

type Props = {
  salas: FilaSala[];
  seleccionada?: string | undefined;
  // En /soporte/salas cada tarjeta ofrece además registrar un equipo en esa sala.
  conRegistro?: boolean | undefined;
};

export function ResumenSalas({ salas, seleccionada, conRegistro = false }: Props) {
  return (
    <ul aria-label="Resumen por sala" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {salas.map((sala) => {
        const activa = sala.id === seleccionada;
        return (
          <li
            key={sala.id}
            className={`relative grid gap-3 rounded-xl border bg-superficie p-5 transition hover:border-primario/50 ${activa ? 'border-primario/70 ring-1 ring-primario/40' : 'border-borde'}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold text-texto">
                {/* Enlace extendido: toda la tarjeta filtra el panel por esta sala. */}
                <Link
                  href={activa ? '/soporte' : `/soporte?salaId=${sala.id}`}
                  aria-current={activa ? 'true' : undefined}
                  className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-2 focus-visible:outline-primario"
                >
                  {sala.nombre}
                  <span className="sr-only">
                    {activa ? ' (filtro activo, pulse para quitarlo)' : ': ver sus equipos'}
                  </span>
                </Link>
              </h3>
              <span className="text-xs uppercase tracking-wider text-texto-suave">
                {plural(sala.totalEquipos, 'equipo', 'equipos')}
              </span>
            </div>

            <p className="text-sm text-texto-suave">
              <span className="text-2xl font-semibold text-texto">{sala.funcionales}</span>{' '}
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
                <dd className="font-semibold text-reparacion">{sala.enReparacion}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Dados de baja:</dt>
                <dd className="font-semibold text-baja">{sala.dadosDeBaja}</dd>
              </div>
            </dl>

            {conRegistro ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-3">
                <Link
                  href={`/soporte/equipos/nuevo?salaId=${sala.id}`}
                  className="relative z-10 text-sm font-medium text-primario underline-offset-4 hover:underline"
                >
                  Registrar equipos aquí
                </Link>
                <AccionesSala id={sala.id} nombre={sala.nombre} totalEquipos={sala.totalEquipos} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
