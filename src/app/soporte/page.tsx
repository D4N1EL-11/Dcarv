import { cookies } from 'next/headers';
import Link from 'next/link';
import { ActividadReciente } from '@/components/soporte/ActividadReciente';
import { BarraEstados } from '@/components/soporte/BarraEstados';
import { FiltrosEquipos } from '@/components/soporte/FiltrosEquipos';
import { GraficoActividad } from '@/components/soporte/GraficoActividad';
import { IndicadoresPanel } from '@/components/soporte/IndicadoresPanel';
import { PendientesAtencion } from '@/components/soporte/PendientesAtencion';
import { ResumenSalas } from '@/components/soporte/ResumenSalas';
import { TablaEquipos } from '@/components/soporte/TablaEquipos';
import { Aviso } from '@/components/ui/Aviso';
import { clasesBoton } from '@/components/ui/Boton';
import { BloquePanel, EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono } from '@/components/ui/Icono';
import { Paginacion } from '@/components/ui/Paginacion';
import { COOKIE_ALERTAS_VISTAS, contarSinVer, leerVistos } from '@/lib/alertasVistas';
import { TAMANO_PAGINA_EQUIPOS } from '@/lib/config/soporte';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import {
  actividadReciente,
  contarIncidenciasPorEstado,
  incidenciasPendientes,
  listarSalas,
  paginarEquipos,
  serieActividad,
} from '@/lib/dataService';
import { formatearFechaLarga, plural } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';
import { normalizarPagina } from '@/lib/reglas/paginacion';
import { esquemaFiltrosEquipos, type FiltrosEquipos as Filtros } from '@/lib/validacion/esquemas';
import { soloSoporte } from '@/lib/auth/sesion';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function consultaFiltros(filtros: Filtros): URLSearchParams {
  const consulta = new URLSearchParams();
  if (filtros.salaId) consulta.set('salaId', filtros.salaId);
  if (filtros.estado) consulta.set('estado', filtros.estado);
  if (filtros.busqueda) consulta.set('busqueda', filtros.busqueda);
  return consulta;
}

function enlacePagina(filtros: Filtros, pagina: number): string {
  const consulta = consultaFiltros(filtros);
  if (pagina > 1) consulta.set('pagina', String(pagina));
  const texto = consulta.toString();
  return texto ? `/soporte?${texto}` : '/soporte';
}

export default async function PanelSoporte({ searchParams }: Props) {
  await soloSoporte();
  const parametros = await searchParams;
  const filtrado = esquemaFiltrosEquipos.safeParse(parametros);
  const filtros = filtrado.success ? filtrado.data : {};
  const pagina = normalizarPagina(parametros.pagina);
  // Todas las consultas en paralelo; la de alertas se comparte con el menú (React cache).
  const [salas, resultado, candidatos, incidencias, serie, eventos, almacen, pendientes] = await Promise.all([
    listarSalas(),
    paginarEquipos(filtros, pagina, TAMANO_PAGINA_EQUIPOS),
    candidatosDeLaPeticion(),
    contarIncidenciasPorEstado(),
    serieActividad(),
    actividadReciente(4),
    cookies(),
    incidenciasPendientes(5),
  ]);
  const equipos = resultado.filas;
  const candidatosSinVer = contarSinVer(
    candidatos.map((c) => c.codigo),
    leerVistos(almacen.get(COOKIE_ALERTAS_VISTAS)?.value),
  );

  if (!salas.length) {
    return (
      <>
        <EncabezadoPagina etiqueta="Primeros pasos" titulo="Bienvenido a Soporte de Salas" />
        <EstadoVacio titulo="Todavía no hay salas registradas">
          <p>Empiece registrando una sala; luego podrá agregar sus equipos.</p>
          <Link href="/soporte/salas" className={`${clasesBoton()} mt-5`}>
            Registrar la primera sala
          </Link>
        </EstadoVacio>
      </>
    );
  }

  const totales = salas.reduce(
    (suma, s) => ({
      funcionales: suma.funcionales + s.funcionales,
      enReparacion: suma.enReparacion + s.enReparacion,
      dadosDeBaja: suma.dadosDeBaja + s.dadosDeBaja,
    }),
    { funcionales: 0, enReparacion: 0, dadosDeBaja: 0 },
  );
  const textoExportar = consultaFiltros(filtros).toString();

  return (
    <>
      <EncabezadoPagina etiqueta={formatearFechaLarga(hoyBogota())} titulo="Panel de salas y equipos">
        <Link
          href={filtros.salaId ? `/soporte/equipos/nuevo?salaId=${filtros.salaId}` : '/soporte/equipos/nuevo'}
          className={clasesBoton()}
        >
          Registrar equipo
        </Link>
        <Link href="/soporte/salas" className={clasesBoton('secundario')}>
          Registrar sala
        </Link>
      </EncabezadoPagina>

      {/* Solo los candidatos nuevos: los ya revisados en /soporte/alertas no vuelven a avisar. */}
      {candidatosSinVer ? (
        <Aviso tipo="advertencia">
          {plural(candidatosSinVer, 'equipo nuevo es candidato', 'equipos nuevos son candidatos')} a
          baja por fallas repetidas.{' '}
          <Link href="/soporte/alertas" className="font-semibold underline underline-offset-4">
            Revisar alertas
          </Link>
        </Aviso>
      ) : null}

      <IndicadoresPanel salas={salas} incidencias={incidencias} />

      <BloquePanel titulo={pendientes.total ? `Requiere atención · ${pendientes.total}` : 'Requiere atención'}>
        <PendientesAtencion incidencias={pendientes.filas} total={pendientes.total} />
      </BloquePanel>

      <div className="grid gap-4 lg:grid-cols-3">
        <BloquePanel titulo="Actividad de los últimos 30 días" className="lg:col-span-2">
          <GraficoActividad serie={serie} />
        </BloquePanel>
        <div className="grid content-start gap-4">
          <BloquePanel titulo="Estado del inventario">
            <BarraEstados {...totales} />
          </BloquePanel>
          <BloquePanel titulo="Movimientos recientes">
            <ActividadReciente eventos={eventos} />
            <Link href="/soporte/actividad" className="w-fit text-sm font-medium text-primario underline-offset-4 hover:underline">
              Ver el registro de cambios
            </Link>
          </BloquePanel>
        </div>
      </div>

      <section aria-labelledby="titulo-salas" className="grid gap-5">
        <TituloSeccion id="titulo-salas" titulo="Salas">
          <p className="text-sm text-texto-suave">Pulse una sala para ver solo sus equipos.</p>
        </TituloSeccion>
        <ResumenSalas salas={salas} seleccionada={filtros.salaId} />
      </section>

      <section aria-labelledby="titulo-equipos" className="grid gap-5">
        <TituloSeccion id="titulo-equipos" titulo="Equipos">
          <a
            href={`/api/soporte/exportar/equipos${textoExportar ? `?${textoExportar}` : ''}`}
            className="flex items-center gap-2 text-sm font-medium text-primario underline-offset-4 hover:underline"
            download
          >
            <Icono nombre="exportar" /> Exportar CSV
          </a>
        </TituloSeccion>
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
