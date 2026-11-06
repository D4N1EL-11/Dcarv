import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ListaAvisos } from '@/components/soporte/ListaAvisos';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { esSoporte } from '@/lib/auth/permisos';
import { obtenerSesion } from '@/lib/auth/sesion';
import { AVISOS_POR_PAGINA } from '@/lib/config/soporte';
import { avisosDe } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { esquemaListaAvisos } from '@/lib/validacion/esquemas';

export const metadata: Metadata = { title: 'Avisos' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Pestana({ href, activa, children }: { href: string; activa: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activa ? 'page' : undefined}
      className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${activa ? 'border-primario bg-primario text-fondo' : 'border-borde bg-superficie text-texto hover:bg-primario-suave'}`}
    >
      {children}
    </Link>
  );
}

// Todos los avisos de la cuenta, del más reciente al más antiguo. "Ver anteriores" pagina por id.
export default async function PaginaAvisos({ searchParams }: Props) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login?siguiente=%2Fsoporte%2Favisos');
  const filtrado = esquemaListaAvisos.safeParse(await searchParams);
  const { antesDe, soloSinLeer } = filtrado.success ? filtrado.data : {};
  const { avisos, sinLeer } = await avisosDe(sesion.id, {
    limite: AVISOS_POR_PAGINA + 1, // uno de más: si llega, hay una página anterior
    antesDe,
    soloSinLeer: soloSinLeer === '1',
  });
  const hayMas = avisos.length > AVISOS_POR_PAGINA;
  const visibles = avisos.slice(0, AVISOS_POR_PAGINA);
  const ultimo = visibles.at(-1);
  const base = soloSinLeer === '1' ? '/soporte/avisos?soloSinLeer=1' : '/soporte/avisos';
  const anteriores = ultimo ? `${base}${base.includes('?') ? '&' : '?'}antesDe=${ultimo.id}` : base;

  return (
    <>
      <EncabezadoPagina
        etiqueta={sinLeer ? plural(sinLeer, 'aviso sin leer', 'avisos sin leer') : 'Todo leído'}
        titulo="Avisos"
        descripcion={
          esSoporte(sesion.rol)
            ? 'Fallas nuevas reportadas por las cuentas de reporte, comentarios en los casos y solicitudes de acceso.'
            : 'Cuándo un técnico toma su caso, cuándo se cierra y lo que soporte le escribe.'
        }
      />
      <nav aria-label="Filtrar avisos" className="flex flex-wrap gap-2">
        <Pestana href="/soporte/avisos" activa={soloSinLeer !== '1'}>
          Todos
        </Pestana>
        <Pestana href="/soporte/avisos?soloSinLeer=1" activa={soloSinLeer === '1'}>
          Sin leer ({sinLeer})
        </Pestana>
      </nav>
      {/* La clave reinicia la lista local al cambiar de página o de filtro. */}
      <ListaAvisos
        key={`${soloSinLeer ?? ''}|${antesDe ?? ''}|${visibles.map((a) => `${a.id}${a.leido ? 'l' : ''}`).join(',')}`}
        avisos={visibles}
        sinLeer={sinLeer}
        textoVacio={soloSinLeer === '1' ? 'No tiene avisos sin leer' : 'Todavía no tiene avisos'}
      />
      <div className="flex flex-wrap gap-4 text-sm">
        {antesDe ? (
          <Link href={base} className="inline-flex items-center gap-1.5 font-medium text-primario underline-offset-4 hover:underline">
            <Icono nombre="izquierda" className="size-3.5" /> Volver a los más recientes
          </Link>
        ) : null}
        {hayMas ? (
          <Link href={anteriores} className="inline-flex items-center gap-1.5 font-medium text-primario underline-offset-4 hover:underline">
            Ver anteriores <Icono nombre="derecha" className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </>
  );
}
