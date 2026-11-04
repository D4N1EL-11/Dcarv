import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormularioIncidencia } from '@/components/soporte/FormularioIncidencia';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { InsigniaEstadoEquipo } from '@/components/soporte/InsigniaEstadoEquipo';
import { MigaDePan } from '@/components/soporte/MigaDePan';
import { SelectorEstadoEquipo } from '@/components/soporte/SelectorEstadoEquipo';
import { Aviso } from '@/components/ui/Aviso';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { listarTecnicos, obtenerEquipo, type DetalleEquipo } from '@/lib/dataService';
import { etiquetaEstadoEquipo, formatearFecha, plural } from '@/lib/formato';
import { esCandidatoABaja } from '@/lib/reglas/alertas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

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
    <div>
      <dt className="text-xs font-semibold text-texto-suave">{titulo}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

export default async function DetalleDeEquipo({ params, searchParams }: Props) {
  const { codigo } = await params;
  const { caso } = await searchParams;
  const [{ equipo, historial }, tecnicos] = await Promise.all([cargar(codigo), listarTecnicos()]);

  const reportada = historial.find((incidencia) => incidencia.numeroCaso === caso);
  const pendientes = historial.filter((i) => i.estado !== 'cerrada').length;
  const ultima = historial[0];
  const candidato = equipo.estado !== 'dado_de_baja' && esCandidatoABaja(equipo.incidencias30d);

  return (
    <>
      <MigaDePan
        pasos={[
          { texto: 'Panel', href: '/soporte' },
          { texto: equipo.sala, href: `/soporte?salaId=${equipo.salaId}` },
          { texto: equipo.codigo },
        ]}
      />

      <Tarjeta className="grid gap-4 sm:grid-cols-[1fr_16rem]">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold break-all">{equipo.codigo}</h1>
            <InsigniaEstadoEquipo estado={equipo.estado} />
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Dato titulo="Sala">
              <Link href={`/soporte?salaId=${equipo.salaId}`} className="text-primario underline">
                {equipo.sala}
              </Link>
            </Dato>
            <Dato titulo={`Incidencias (${DIAS_VENTANA_ALERTA} días)`}>{equipo.incidencias30d}</Dato>
            <Dato titulo="Pendientes">{plural(pendientes, 'incidencia', 'incidencias')}</Dato>
            <Dato titulo="Último reporte">{ultima ? formatearFecha(ultima.fecha) : 'Nunca'}</Dato>
          </dl>
        </div>
        <div className="grid content-start gap-1">
          <span className="text-sm font-semibold">Estado del equipo</span>
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

      <section aria-labelledby="titulo-historial" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-historial" className="text-lg font-bold">
            Historial de incidencias{' '}
            <span className="text-sm font-normal text-texto-suave">
              ({plural(historial.length, 'registro', 'registros')}, la más reciente primero)
            </span>
          </h2>
          <FormularioIncidencia codigo={equipo.codigo} estado={equipo.estado} />
        </div>
        <HistorialIncidencias
          incidencias={historial}
          tecnicos={tecnicos}
          textoVacio="Este equipo no tiene incidencias"
        />
      </section>
    </>
  );
}
