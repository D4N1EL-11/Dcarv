import Link from 'next/link';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import type { EventoActividad } from '@/lib/dataService';
import { tiempoRelativo } from '@/lib/formato';

const DESCRIPCION: Record<EventoActividad['tipo'], { verbo: string; icono: NombreIcono; color: string }> = {
  reportada: { verbo: 'reportada en', icono: 'incidencias', color: 'text-reparacion' },
  en_revision: { verbo: 'en revisión ·', icono: 'tecnicos', color: 'text-revision' },
  cerrada: { verbo: 'cerrada ·', icono: 'check', color: 'text-funcional' },
  abierta: { verbo: 'abierta en', icono: 'incidencias', color: 'text-reparacion' },
};

export function ActividadReciente({ eventos }: { eventos: EventoActividad[] }) {
  if (!eventos.length) {
    return <p className="text-sm text-texto-suave">Todavía no hay movimientos.</p>;
  }
  const ahora = new Date();
  return (
    <ol className="grid gap-1">
      {eventos.map((evento) => {
        const { verbo, icono, color } = DESCRIPCION[evento.tipo];
        const detalle = evento.tipo === 'en_revision' && evento.tecnico ? evento.tecnico : evento.equipoCodigo;
        return (
          <li key={`${evento.tipo}-${evento.numeroCaso}-${evento.momento}`}>
            <Link
              href={`/soporte/incidencias/${encodeURIComponent(evento.numeroCaso)}`}
              className="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-primario-suave"
            >
              <span className={`mt-0.5 grid size-6 place-items-center rounded-full bg-superficie-alta ${color}`}>
                <Icono nombre={icono} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium text-texto">{evento.numeroCaso}</span>{' '}
                <span className="text-texto-suave">{verbo}</span>{' '}
                <span className="text-texto">{detalle}</span>
                <span className="block text-xs text-texto-suave">
                  <time dateTime={evento.momento}>{tiempoRelativo(evento.momento, ahora)}</time>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
