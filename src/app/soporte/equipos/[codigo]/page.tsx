import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormularioIncidencia } from '@/components/soporte/FormularioIncidencia';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { ListaEventos } from '@/components/soporte/ListaEventos';
import { InsigniaEstadoEquipo } from '@/components/soporte/InsigniaEstadoEquipo';
import { MigaDePan } from '@/components/soporte/MigaDePan';
import { SelectorEstadoEquipo } from '@/components/soporte/SelectorEstadoEquipo';
import { TrasladarEquipo } from '@/components/soporte/TrasladarEquipo';
import { Aviso } from '@/components/ui/Aviso';
import { BotonImprimir } from '@/components/ui/BotonImprimir';
import { clasesBoton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { tecnicosDeLaPeticion } from '@/lib/consultasDePagina';
import { eventosDeEquipo, listarSalas, obtenerEquipo, type DetalleEquipo } from '@/lib/dataService';
import { etiquetaEstadoEquipo, formatearFecha, plural } from '@/lib/formato';
import { esCandidatoABaja } from '@/lib/reglas/alertas';
import { normalizarCodigo } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';
import { soloSoporte } from '@/lib/auth/sesion';

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ caso?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return { title: decodeURIComponent(codigo) };
}

async function cargar(codigo: string): Promise<DetalleEquipo> {
  try {
    return await obtenerEquipo(decodeURIComponent(codigo));
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'EQUIPO_NO_ENCONTRADO') notFound();
    throw error;
  }
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-texto-suave">{titulo}</dt>
      <dd className="text-lg font-semibold">{children}</dd>
    </div>
  );
}

export default async function DetalleDeEquipo({ params, searchParams }: Props) {
  await soloSoporte();
  const { codigo } = await params;
  const { caso } = await searchParams;
  const [{ equipo, historial }, tecnicos, salas, eventos] = await Promise.all([
    cargar(codigo),
    tecnicosDeLaPeticion(),
    listarSalas(),
    eventosDeEquipo(normalizarCodigo(decodeURIComponent(codigo)), 21),
  ]);

  const reportada = historial.find((incidencia) => incidencia.numeroCaso === caso);
  const pendientes = historial.filter((i) => i.estado !== 'cerrada').length;
  const cerradas = historial.length - pendientes;
  const ultima = historial[0];
  const candidato = equipo.estado !== 'dado_de_baja' && esCandidatoABaja(equipo.incidencias30d);

  return (
    <>
      <div className="print:hidden">
        <MigaDePan
          pasos={[
            { texto: 'Panel', href: '/soporte' },
            { texto: equipo.sala, href: `/soporte?salaId=${equipo.salaId}` },
            { texto: equipo.codigo },
          ]}
        />
      </div>

      <EncabezadoPagina etiqueta={`Hoja de vida del equipo · ${equipo.sala}`} titulo={equipo.codigo}>
        <TrasladarEquipo
          codigo={equipo.codigo}
          salaActualId={equipo.salaId}
          salas={salas.map(({ id, nombre }) => ({ id, nombre }))}
        />
        <Link
          href={`/soporte/etiquetas?equipo=${encodeURIComponent(equipo.codigo)}`}
          className={`${clasesBoton('secundario')} gap-2`}
        >
          <Icono nombre="qr" /> Etiqueta QR
        </Link>
        <BotonImprimir texto="Imprimir ficha" />
      </EncabezadoPagina>
      <p className="hidden text-xs print:block">Impreso el {formatearFecha(hoyBogota())} · Soporte de Salas</p>

      <Tarjeta className="grid gap-6 sm:grid-cols-[1fr_16rem]">
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Dato titulo="Estado">
            <InsigniaEstadoEquipo estado={equipo.estado} />
          </Dato>
          <Dato titulo="Sala">
            <Link href={`/soporte?salaId=${equipo.salaId}`} className="text-primario underline-offset-4 hover:underline">
              {equipo.sala}
            </Link>
          </Dato>
          <Dato titulo={`Incidencias (${DIAS_VENTANA_ALERTA} días)`}>{equipo.incidencias30d}</Dato>
          <Dato titulo="Pendientes">{plural(pendientes, 'incidencia', 'incidencias')}</Dato>
          <Dato titulo="Cerradas">{cerradas}</Dato>
          <Dato titulo="Último reporte">{ultima ? formatearFecha(ultima.fecha) : 'Nunca'}</Dato>
        </dl>
        <div className="grid content-start gap-2 print:hidden">
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-texto-suave">
            Cambiar estado
          </span>
          <SelectorEstadoEquipo codigo={equipo.codigo} estado={equipo.estado} />
        </div>
      </Tarjeta>

      {candidato ? (
        <Aviso tipo="advertencia">
          Este equipo acumula {equipo.incidencias30d} incidencias en los últimos{' '}
          {DIAS_VENTANA_ALERTA} días: es candidato a baja. Revise el historial antes de decidir.
        </Aviso>
      ) : null}

      {reportada ? (
        <Aviso tipo="exito">
          Incidencia {reportada.numeroCaso} registrada. Estado del equipo:{' '}
          {etiquetaEstadoEquipo(equipo.estado)}.
        </Aviso>
      ) : null}

      <section aria-labelledby="titulo-historial" className="grid gap-5">
        <TituloSeccion id="titulo-historial" titulo="Historial de incidencias">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-texto-suave">
              {plural(historial.length, 'registro', 'registros')}, la más reciente primero
            </span>
            <span className="print:hidden">
              <FormularioIncidencia codigo={equipo.codigo} estado={equipo.estado} />
            </span>
          </div>
        </TituloSeccion>
        <HistorialIncidencias
          incidencias={historial}
          tecnicos={tecnicos}
          textoVacio="Este equipo no tiene incidencias"
          variante="linea"
        />
      </section>

      <section aria-labelledby="titulo-registro" className="grid gap-5">
        <TituloSeccion id="titulo-registro" titulo="Registro de cambios">
          <span className="text-sm text-texto-suave">Quién hizo qué y cuándo</span>
        </TituloSeccion>
        <ListaEventos eventos={eventos.slice(0, 20)} mostrarEnlaces={false} />
        {eventos.length > 20 ? (
          <Link
            href={`/soporte/actividad?equipo=${encodeURIComponent(equipo.codigo)}`}
            className="w-fit text-sm font-medium text-primario underline-offset-4 hover:underline print:hidden"
          >
            Ver todo el registro de este equipo
          </Link>
        ) : null}
      </section>
    </>
  );
}
