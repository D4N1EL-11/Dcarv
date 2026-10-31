import Link from 'next/link';
import { FiltrosEquipos } from '@/components/soporte/FiltrosEquipos';
import { TablaEquipos } from '@/components/soporte/TablaEquipos';
import { Aviso } from '@/components/ui/Aviso';
import { clasesBoton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarCandidatosABaja, listarEquipos, listarSalas } from '@/lib/dataService';
import { esquemaFiltrosEquipos } from '@/lib/validacion/esquemas';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PanelSoporte({ searchParams }: Props) {
  const filtrado = esquemaFiltrosEquipos.safeParse(await searchParams);
  const filtros = filtrado.success ? filtrado.data : {};
  const [salas, equipos, candidatos] = await Promise.all([
    listarSalas(),
    listarEquipos(filtros),
    listarCandidatosABaja(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Panel de salas y equipos</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/soporte/equipos/nuevo" className={clasesBoton()}>
            Registrar equipo
          </Link>
          <Link href="/soporte/salas" className={clasesBoton('secundario')}>
            Registrar sala
          </Link>
        </div>
      </div>

      {candidatos.length ? (
        <Aviso tipo="advertencia">
          Hay {candidatos.length} {candidatos.length === 1 ? 'equipo candidato' : 'equipos candidatos'}{' '}
          a baja.{' '}
          <Link href="/soporte/alertas" className="font-semibold underline">
            Ver alertas
          </Link>
        </Aviso>
      ) : null}

      {salas.length ? (
        <section aria-label="Resumen por sala" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {salas.map((sala) => (
            <Tarjeta key={sala.id}>
              <h2 className="font-bold">{sala.nombre}</h2>
              <p className="text-sm text-texto-suave">{sala.totalEquipos} equipos</p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-texto-suave">Funcionales</dt>
                  <dd className="font-bold text-funcional">{sala.funcionales}</dd>
                </div>
                <div>
                  <dt className="text-texto-suave">En reparación</dt>
                  <dd className="font-bold text-[#8a5a12]">{sala.enReparacion}</dd>
                </div>
                <div>
                  <dt className="text-texto-suave">Dados de baja</dt>
                  <dd className="font-bold text-baja">{sala.dadosDeBaja}</dd>
                </div>
              </dl>
            </Tarjeta>
          ))}
        </section>
      ) : null}

      <FiltrosEquipos salas={salas} {...filtros} />

      {equipos.length ? (
        <TablaEquipos equipos={equipos} />
      ) : (
        <EstadoVacio titulo="No hay equipos para mostrar">
          Registre un equipo o cambie los filtros.
        </EstadoVacio>
      )}
    </>
  );
}
