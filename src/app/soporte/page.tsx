import Link from 'next/link';
import { FiltrosEquipos } from '@/components/soporte/FiltrosEquipos';
import { IndicadoresPanel } from '@/components/soporte/IndicadoresPanel';
import { ResumenSalas } from '@/components/soporte/ResumenSalas';
import { TablaEquipos } from '@/components/soporte/TablaEquipos';
import { Aviso } from '@/components/ui/Aviso';
import { clasesBoton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import {
  contarIncidenciasPorEstado,
  listarCandidatosABaja,
  listarEquipos,
  listarSalas,
} from '@/lib/dataService';
import { formatearFecha, plural } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';
import { esquemaFiltrosEquipos } from '@/lib/validacion/esquemas';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PanelSoporte({ searchParams }: Props) {
  const filtrado = esquemaFiltrosEquipos.safeParse(await searchParams);
  const filtros = filtrado.success ? filtrado.data : {};
  const [salas, equipos, candidatos, incidencias] = await Promise.all([
    listarSalas(),
    listarEquipos(filtros),
    listarCandidatosABaja(),
    contarIncidenciasPorEstado(),
  ]);

  if (!salas.length) {
    return (
      <>
        <h1 className="text-2xl font-bold">Bienvenido a Soporte de Salas</h1>
        <EstadoVacio titulo="Todavía no hay salas registradas">
          <p>Empiece registrando una sala; luego podrá agregar sus equipos.</p>
          <Link href="/soporte/salas" className={`${clasesBoton()} mt-4`}>
            Registrar la primera sala
          </Link>
        </EstadoVacio>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Panel de salas y equipos</h1>
          <p className="text-sm text-texto-suave">Estado al {formatearFecha(hoyBogota())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={filtros.salaId ? `/soporte/equipos/nuevo?salaId=${filtros.salaId}` : '/soporte/equipos/nuevo'}
            className={clasesBoton()}
          >
            Registrar equipo
          </Link>
          <Link href="/soporte/salas" className={clasesBoton('secundario')}>
            Registrar sala
          </Link>
        </div>
      </div>

      {candidatos.length ? (
        <Aviso tipo="advertencia">
          {plural(candidatos.length, 'equipo es candidato', 'equipos son candidatos')} a baja por
          fallas repetidas.{' '}
          <Link href="/soporte/alertas" className="font-semibold underline">
            Revisar alertas
          </Link>
        </Aviso>
      ) : null}

      <IndicadoresPanel salas={salas} incidencias={incidencias} />

      <section aria-labelledby="titulo-salas" className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-salas" className="text-lg font-bold">
            Salas
          </h2>
          <p className="text-sm text-texto-suave">Pulse una sala para ver solo sus equipos.</p>
        </div>
        <ResumenSalas salas={salas} seleccionada={filtros.salaId} />
      </section>

      <section aria-labelledby="titulo-equipos" className="grid gap-3">
        <h2 id="titulo-equipos" className="text-lg font-bold">
          Equipos
        </h2>
        {/* La clave reinicia los filtros cuando la URL cambia desde fuera (p. ej. al pulsar una sala). */}
        <FiltrosEquipos
          key={`${filtros.salaId ?? ''}|${filtros.estado ?? ''}|${filtros.busqueda ?? ''}`}
          salas={salas}
          salaId={filtros.salaId}
          estado={filtros.estado}
          busqueda={filtros.busqueda}
          total={equipos.length}
        />
        {equipos.length ? (
          <TablaEquipos equipos={equipos} />
        ) : (
          <EstadoVacio titulo="No hay equipos para mostrar">
            {filtros.salaId || filtros.estado || filtros.busqueda
              ? 'Ningún equipo coincide con los filtros. Pruebe con otros o límpielos.'
              : 'Registre el primer equipo con el botón "Registrar equipo".'}
          </EstadoVacio>
        )}
      </section>
    </>
  );
}
