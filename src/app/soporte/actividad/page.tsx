import type { Metadata } from 'next';
import Link from 'next/link';
import { ListaEventos } from '@/components/soporte/ListaEventos';
import { Boton } from '@/components/ui/Boton';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Selector } from '@/components/ui/Selector';
import { soloSoporte } from '@/lib/auth/sesion';
import { actoresDeEventos, eventosRecientes } from '@/lib/dataService';
import { normalizarCodigo } from '@/lib/reglas/equipo';

export const metadata: Metadata = { title: 'Registro de cambios' };

const POR_PAGINA = 50;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined;
}

export default async function PaginaActividad({ searchParams }: Props) {
  await soloSoporte();
  const parametros = await searchParams;
  const actor = texto(parametros.actor);
  const equipo = texto(parametros.equipo) ? normalizarCodigo(texto(parametros.equipo)!) : undefined;
  const antes = Number(texto(parametros.antes));
  const antesDe = Number.isInteger(antes) && antes > 0 ? antes : undefined;

  // Uno de más para saber si hay una página anterior.
  const [eventos, actores] = await Promise.all([
    eventosRecientes({ actor, equipoCodigo: equipo, antesDe }, POR_PAGINA + 1),
    actoresDeEventos(),
  ]);
  const hayMas = eventos.length > POR_PAGINA;
  const visibles = eventos.slice(0, POR_PAGINA);

  const consulta = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries({ actor, equipo, ...extra })) if (valor) params.set(clave, valor);
    const cadena = params.toString();
    return cadena ? `/soporte/actividad?${cadena}` : '/soporte/actividad';
  };

  return (
    <>
      <EncabezadoPagina
        etiqueta="Auditoría"
        titulo="Registro de cambios"
        descripcion="Quién hizo qué y cuándo: reportes, cambios de estado, asignaciones, cierres, traslados y la administración de salas, equipos, técnicos y cuentas. Las reasignaciones automáticas aparecen como “El sistema”."
      />

      <form method="get" action="/soporte/actividad" className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        {equipo ? <input type="hidden" name="equipo" value={equipo} /> : null}
        <Selector
          etiqueta="Persona"
          name="actor"
          defaultValue={actor ?? ''}
          opciones={[{ valor: '', texto: 'Todas las personas' }, ...actores.map((a) => ({ valor: a, texto: a === 'sistema' ? 'El sistema' : a }))]}
        />
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
      </form>

      {equipo ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-texto-suave">
          Solo el equipo <strong className="text-texto">{equipo}</strong>
          <Link href={consulta({ equipo: undefined })} className="text-primario underline-offset-4 hover:underline">
            Ver todos
          </Link>
        </p>
      ) : null}

      <ListaEventos eventos={visibles} />

      <nav aria-label="Páginas del registro" className="flex flex-wrap justify-between gap-3">
        {antesDe ? (
          <Link href={consulta({})} className="text-sm font-medium text-primario underline-offset-4 hover:underline">
            ← Lo más reciente
          </Link>
        ) : (
          <span />
        )}
        {hayMas ? (
          <Link
            href={consulta({ antes: String(visibles[visibles.length - 1]!.id) })}
            className="text-sm font-medium text-primario underline-offset-4 hover:underline"
          >
            Más antiguos →
          </Link>
        ) : null}
      </nav>
    </>
  );
}
