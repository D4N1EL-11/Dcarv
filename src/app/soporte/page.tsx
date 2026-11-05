import Link from 'next/link';
import { FiltrosEquipos } from '@/components/soporte/FiltrosEquipos';
import { IndicadoresPanel } from '@/components/soporte/IndicadoresPanel';
import { ResumenSalas } from '@/components/soporte/ResumenSalas';
import { TablaEquipos } from '@/components/soporte/TablaEquipos';
import { Aviso } from '@/components/ui/Aviso';
import { clasesBoton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Paginacion } from '@/components/ui/Paginacion';
import { TAMANO_PAGINA_EQUIPOS } from '@/lib/config/soporte';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import { contarIncidenciasPorEstado, listarSalas, paginarEquipos } from '@/lib/dataService';
import { formatearFecha, plural } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';
import { normalizarPagina } from '@/lib/reglas/paginacion';
import { esquemaFiltrosEquipos, type FiltrosEquipos as Filtros } from '@/lib/validacion/esquemas';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function enlacePagina(filtros: Filtros, pagina: number): string {
  const consulta = new URLSearchParams();
  if (filtros.salaId) consulta.set('salaId', filtros.salaId);
  if (filtros.estado) consulta.set('estado', filtros.estado);
  if (filtros.busqueda) consulta.set('busqueda', filtros.busqueda);
  if (pagina > 1) consulta.set('pagina', String(pagina));
  const texto = consulta.toString();
  return texto ? `/soporte?${texto}` : '/soporte';
}

function Encabezado({ etiqueta, titulo, children }: { etiqueta: string; titulo: string; children?: React.ReactNode }) {
  return (
    <header className="grid gap-5">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="h-px w-10 bg-primario/70" />
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-texto-suave">{etiqueta}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-4xl font-medium leading-none sm:text-5xl">{titulo}</h1>
        {children}
      </div>
    </header>
  );
}

function TituloSeccion({ id, titulo, children }: { id: string; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-borde pb-3">
      <h2 id={id} className="text-2xl font-medium">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

export default async function PanelSoporte({ searchParams }: Props) {
  const parametros = await searchParams;
  const filtrado = esquemaFiltrosEquipos.safeParse(parametros);
  const filtros = filtrado.success ? filtrado.data : {};
  const pagina = normalizarPagina(parametros.pagina);
  const [salas, resultado, candidatos, incidencias] = await Promise.all([
    listarSalas(),
    paginarEquipos(filtros, pagina, TAMANO_PAGINA_EQUIPOS),
    candidatosDeLaPeticion(),
    contarIncidenciasPorEstado(),
  ]);
  const equipos = resultado.filas;

  if (!salas.length) {
    return (
      <>
        <Encabezado etiqueta="Primeros pasos" titulo="Bienvenido a Soporte de Salas" />
        <EstadoVacio titulo="Todavía no hay salas registradas">
          <p>Empiece registrando una sala; luego podrá agregar sus equipos.</p>
          <Link href="/soporte/salas" className={`${clasesBoton()} mt-5`}>
            Registrar la primera sala
          </Link>
        </EstadoVacio>
      </>
    );
  }

  return (
    <>
      <Encabezado etiqueta={`Estado al ${formatearFecha(hoyBogota())}`} titulo="Panel de salas y equipos">
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
      </Encabezado>

      {candidatos.length ? (
        <Aviso tipo="advertencia">
          {plural(candidatos.length, 'equipo es candidato', 'equipos son candidatos')} a baja por
          fallas repetidas.{' '}
          <Link href="/soporte/alertas" className="font-semibold underline underline-offset-4">
            Revisar alertas
          </Link>
        </Aviso>
      ) : null}

      <IndicadoresPanel salas={salas} incidencias={incidencias} />

      <section aria-labelledby="titulo-salas" className="grid gap-5">
        <TituloSeccion id="titulo-salas" titulo="Salas">
          <p className="text-sm text-texto-suave">Pulse una sala para ver solo sus equipos.</p>
        </TituloSeccion>
        <ResumenSalas salas={salas} seleccionada={filtros.salaId} />
      </section>

      <section aria-labelledby="titulo-equipos" className="grid gap-5">
        <TituloSeccion id="titulo-equipos" titulo="Equipos" />
        {/* La clave reinicia los filtros cuando la URL cambia desde fuera (p. ej. al pulsar una sala). */}
        <FiltrosEquipos
          key={`${filtros.salaId ?? ''}|${filtros.estado ?? ''}|${filtros.busqueda ?? ''}`}
          salas={salas}
          salaId={filtros.salaId}
          estado={filtros.estado}
          busqueda={filtros.busqueda}
          total={resultado.total}
        />
        {equipos.length ? (
          <>
            <TablaEquipos equipos={equipos} />
            <Paginacion
              pagina={resultado.pagina}
              paginas={resultado.paginas}
              total={resultado.total}
              tamano={resultado.tamano}
              enlace={(numero) => enlacePagina(filtros, numero)}
              nombre="equipos"
            />
          </>
        ) : resultado.total > 0 ? (
          // ?pagina= más allá de la última (p. ej. un enlace viejo tras dar de baja equipos).
          <EstadoVacio titulo={`La página ${pagina} no existe`}>
            <Link href={enlacePagina(filtros, 1)} className="font-medium text-primario underline-offset-4 hover:underline">
              Ir a la primera página
            </Link>
          </EstadoVacio>
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
