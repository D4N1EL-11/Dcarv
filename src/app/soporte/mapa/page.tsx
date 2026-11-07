import type { Metadata } from 'next';
import Link from 'next/link';
import { MapaSala } from '@/components/soporte/MapaSala';
import { clasesBoton } from '@/components/ui/Boton';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { soloSoporte } from '@/lib/auth/sesion';
import { listarSalas, mapaDeSala } from '@/lib/dataService';
import { plural, porcentaje } from '@/lib/formato';

export const metadata: Metadata = { title: 'Mapa de salas' };

type Props = { searchParams: Promise<{ sala?: string | string[] }> };

// Mapa de cada sala: los equipos en su puesto, con el color de su estado. ?sala= elige la sala;
// sin ella (o con una que no existe) se muestra la primera.
export default async function PaginaMapa({ searchParams }: Props) {
  await soloSoporte();
  const { sala: pedida } = await searchParams;
  const salas = await listarSalas();
  if (!salas.length) {
    return (
      <>
        <EncabezadoPagina etiqueta="Espacios" titulo="Mapa de salas" />
        <EstadoVacio titulo="Todavía no hay salas registradas" icono="salas">
          <Link href="/soporte/salas" className={`${clasesBoton()} mt-4`}>
            Registrar una sala
          </Link>
        </EstadoVacio>
      </>
    );
  }
  const actual = salas.find((s) => s.id === pedida) ?? salas[0]!;
  const mapa = await mapaDeSala(actual.id);

  return (
    <>
      <EncabezadoPagina
        etiqueta="Espacios"
        titulo="Mapa de salas"
        descripcion={
          <>
            {actual.nombre}: {plural(actual.totalEquipos, 'equipo', 'equipos')},{' '}
            {porcentaje(actual.funcionales, actual.totalEquipos)} % disponibles. Pulse un equipo para abrir su ficha.
          </>
        }
      >
        <Link
          href={`/soporte/equipos/nuevo?salaId=${actual.id}`}
          className={clasesBoton('secundario')}
        >
          Registrar equipo aquí
        </Link>
      </EncabezadoPagina>

      <nav aria-label="Elegir sala" className="flex flex-wrap gap-2">
        {salas.map((sala) => {
          const activa = sala.id === actual.id;
          return (
            <Link
              key={sala.id}
              href={`/soporte/mapa?sala=${sala.id}`}
              aria-current={activa ? 'page' : undefined}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-primario ${activa ? 'border-primario bg-primario text-fondo' : 'border-borde bg-superficie text-texto hover:bg-primario-suave'}`}
            >
              {sala.nombre}{' '}
              <span className={activa ? 'text-fondo/70' : 'text-texto-suave'}>({sala.totalEquipos})</span>
            </Link>
          );
        })}
      </nav>

      {mapa.equipos.length ? (
        // La clave reinicia el modo "organizar" al cambiar de sala.
        <MapaSala key={actual.id} mapa={mapa} />
      ) : (
        <EstadoVacio titulo={`${actual.nombre} no tiene equipos`} icono="equipo">
          <Link href={`/soporte/equipos/nuevo?salaId=${actual.id}`} className={`${clasesBoton()} mt-4`}>
            Registrar el primero
          </Link>
        </EstadoVacio>
      )}
    </>
  );
}
