import { notFound } from 'next/navigation';
import { FormularioIncidencia } from '@/components/soporte/FormularioIncidencia';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { InsigniaEstadoEquipo } from '@/components/soporte/InsigniaEstadoEquipo';
import { SelectorEstadoEquipo } from '@/components/soporte/SelectorEstadoEquipo';
import { Aviso } from '@/components/ui/Aviso';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarTecnicos, obtenerEquipo, type DetalleEquipo } from '@/lib/dataService';
import { etiquetaEstadoEquipo } from '@/lib/formato';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ caso?: string | string[] }>;
};

async function cargar(codigo: string): Promise<DetalleEquipo> {
  try {
    return await obtenerEquipo(decodeURIComponent(codigo));
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'EQUIPO_NO_ENCONTRADO') notFound();
    throw error;
  }
}

export default async function DetalleDeEquipo({ params, searchParams }: Props) {
  const { codigo } = await params;
  const { caso } = await searchParams;
  const [{ equipo, historial }, tecnicos] = await Promise.all([cargar(codigo), listarTecnicos()]);

  const reportada = historial.find((incidencia) => incidencia.numeroCaso === caso);

  return (
    <>
      <Tarjeta className="grid gap-4 sm:grid-cols-[1fr_16rem]">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold break-all">{equipo.codigo}</h1>
          <p className="text-sm text-texto-suave">Sala: {equipo.sala}</p>
          <div>
            <InsigniaEstadoEquipo estado={equipo.estado} />
          </div>
          <p className="text-sm text-texto-suave">
            Incidencias en los últimos 30 días: {equipo.incidencias30d}
          </p>
        </div>
        <SelectorEstadoEquipo codigo={equipo.codigo} estado={equipo.estado} />
      </Tarjeta>

      <FormularioIncidencia codigo={equipo.codigo} />
      {reportada ? (
        <Aviso tipo="exito">
          Incidencia {reportada.numeroCaso} registrada. Estado del equipo:{' '}
          {etiquetaEstadoEquipo(equipo.estado)}.
        </Aviso>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">Historial de incidencias</h2>
        <HistorialIncidencias
          incidencias={historial}
          tecnicos={tecnicos}
          textoVacio="Este equipo no tiene incidencias"
        />
      </section>
    </>
  );
}
