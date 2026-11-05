import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import type { AccionEvento, FilaEvento } from '@/lib/dataService';
import { textoEvento, tiempoRelativo } from '@/lib/formato';

const ICONO: Record<AccionEvento, NombreIcono> = {
  incidencia_reportada: 'incidencias',
  incidencia_asignada: 'tecnicos',
  incidencia_reasignada: 'tecnicos',
  incidencia_cerrada: 'check',
  foto_agregada: 'camara',
  estado_equipo: 'equipo',
  equipo_registrado: 'equipo',
  equipo_trasladado: 'traslado',
  sala_registrada: 'salas',
  sala_renombrada: 'salas',
  sala_eliminada: 'salas',
  tecnico_registrado: 'tecnicos',
  tecnico_renombrado: 'tecnicos',
  tecnico_activado: 'tecnicos',
  tecnico_desactivado: 'tecnicos',
  rol_cambiado: 'usuario',
};

const formatoMomento = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

function enlaceDe(evento: FilaEvento): string | null {
  if (!evento.equipoCodigo) return null;
  const ficha = `/soporte/equipos/${encodeURIComponent(evento.equipoCodigo)}`;
  return evento.numeroCaso ? `${ficha}#${evento.numeroCaso}` : ficha;
}

// Registro de cambios: quién hizo qué y cuándo. mostrarEnlaces=false en la propia ficha del equipo.
export function ListaEventos({ eventos, mostrarEnlaces = true }: { eventos: FilaEvento[]; mostrarEnlaces?: boolean }) {
  if (!eventos.length) {
    return <EstadoVacio titulo="Sin cambios registrados" icono="reloj">Los cambios aparecerán aquí a medida que ocurran.</EstadoVacio>;
  }
  return (
    <ol className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
      {eventos.map((evento) => {
        const enlace = mostrarEnlaces ? enlaceDe(evento) : null;
        return (
          <li key={evento.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-superficie-alta text-primario">
              <Icono nombre={ICONO[evento.accion] ?? 'reloj'} className="size-3.5" />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <p className="text-sm break-words text-texto">
                <span className="font-semibold">{evento.actor === 'sistema' ? 'El sistema' : evento.actor}</span>{' '}
                {textoEvento(evento)}
              </p>
              <p className="text-xs text-texto-suave">
                <time dateTime={evento.momento} title={formatoMomento.format(new Date(evento.momento))}>
                  {tiempoRelativo(evento.momento)} · {formatoMomento.format(new Date(evento.momento))}
                </time>
              </p>
            </div>
            {enlace ? (
              <Link href={enlace} className="shrink-0 text-xs font-medium text-primario underline-offset-4 hover:underline print:hidden">
                Ver
              </Link>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
