import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono } from '@/components/ui/Icono';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { DIAS_VENTANA_ALERTA, INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';
import type { FilaCandidato } from '@/lib/dataService';
import { formatearFecha, plural, textoAntiguedad } from '@/lib/formato';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';
import { InsigniaEstadoEquipo } from './InsigniaEstadoEquipo';
import { SelectorEstadoEquipo } from './SelectorEstadoEquipo';

// Aviso temprano: equipos a una falla del umbral. Solo informa; no cambia el estado de nada.
export function PanelObservacion({ equipos }: { equipos: FilaCandidato[] }) {
  if (!equipos.length) {
    return (
      <p className="flex items-center gap-3 rounded-xl border border-dashed border-borde px-5 py-4 text-sm text-texto-suave">
        <Icono nombre="check" className="size-4 text-funcional" />
        Ningún equipo está cerca del umbral de alerta.
      </p>
    );
  }
  const hoy = hoyBogota();
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {equipos.map((equipo) => (
        <li key={equipo.codigo}>
          <Tarjeta className="grid h-full gap-2 border-l-4 border-l-reparacion">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/soporte/equipos/${encodeURIComponent(equipo.codigo)}`}
                className="font-semibold break-all text-primario underline-offset-4 hover:underline"
              >
                {equipo.codigo}
              </Link>
              <InsigniaEstadoEquipo estado={equipo.estado} />
            </div>
            <p className="text-sm text-texto-suave">Sala: {equipo.sala}</p>
            <p className="text-sm">
              <span className="font-semibold text-reparacion">{equipo.incidencias30d}</span> de{' '}
              {INCIDENCIAS_PARA_ALERTA} fallas en {DIAS_VENTANA_ALERTA} días
            </p>
            <p className="text-xs text-texto-suave">
              Último reporte {textoAntiguedad(diasEntre(equipo.ultimaFecha, hoy))}
              {equipo.pendientes ? ` · ${plural(equipo.pendientes, 'pendiente', 'pendientes')}` : ''}
            </p>
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}

// Cada candidato se puede revisar (historial e incidencias) o dar de baja aquí mismo, con confirmación.
export function PanelAlertas({ candidatos }: { candidatos: FilaCandidato[] }) {
  if (!candidatos.length) {
    return (
      <EstadoVacio titulo="No hay equipos candidatos a baja">
        Ningún equipo en servicio acumula fallas repetidas en este momento.
      </EstadoVacio>
    );
  }
  const hoy = hoyBogota();
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
            <div className="grid gap-1 text-sm">
              <p>
                <span className="text-2xl font-bold text-baja">{candidato.incidencias30d}</span>{' '}
                {candidato.incidencias30d === 1 ? 'incidencia' : 'incidencias'} en {DIAS_VENTANA_ALERTA} días
              </p>
              <p className="text-xs text-texto-suave">
                Último reporte: {formatearFecha(candidato.ultimaFecha)} (
                {textoAntiguedad(diasEntre(candidato.ultimaFecha, hoy))})
              </p>
              <Link
                href={`/soporte/incidencias?equipoCodigo=${encodeURIComponent(candidato.codigo)}`}
                className="text-xs text-primario underline-offset-4 hover:underline"
              >
                {candidato.pendientes
                  ? `${plural(candidato.pendientes, 'incidencia pendiente', 'incidencias pendientes')} · ver todas`
                  : 'Sin incidencias pendientes · ver todas'}
              </Link>
            </div>
            <div className="grid gap-1">
              <span className="text-xs font-semibold text-texto-suave">Cambiar estado</span>
              <SelectorEstadoEquipo codigo={candidato.codigo} estado={candidato.estado} compacto />
            </div>
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}
